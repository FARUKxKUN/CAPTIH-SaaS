-- Captih v1 — Supabase schema (Clerk-compatible)
-- Auth lives in Clerk; Supabase only stores domain data (profiles, credits, jobs).
-- profiles.id is a Clerk user ID (text, e.g. "user_2abc...") — not a Postgres UUID.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → paste → Run
-- Idempotent: safe to re-run.

-- ────────────────────────────────────────────────────────────────────────────
-- 0. Extensions
-- ────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "pg_cron";  -- scheduled cleanup jobs

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Profiles — synced from Clerk via webhook (clerk-sync route)
--    Free-trial credit (3 min) is seeded HERE in the webhook handler, not by trigger.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id text primary key,             -- Clerk user ID, e.g. "user_2abc..."
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Credits — current balance per user (one row per user)
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.credits (
  user_id text primary key references public.profiles(id) on delete cascade,
  balance_minutes integer not null default 0 check (balance_minutes >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists credits_balance_idx on public.credits(balance_minutes);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Credit transactions — immutable audit trail of every credit change
-- ────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.credit_reason as enum (
    'free_trial_grant',
    'pack_purchase',
    'custom_purchase',
    'transcription_debit',
    'refund',
    'expiry',
    'admin_adjustment'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  amount_minutes integer not null,         -- positive = credit, negative = debit
  reason public.credit_reason not null,
  balance_after integer not null,          -- materialized for fast UI
  pack_id text,                            -- 'pack-10' / 'pack-30' / 'pack-60' / 'pack-180'
  custom_minutes integer,                  -- 60..1800 for 'custom_purchase'
  related_job_id uuid,                     -- FK set after jobs table exists
  dhmad_transaction_id text,               -- payment provider ref
  expires_at timestamptz,                  -- only set for custom_purchase (30-day) credits
  created_at timestamptz not null default now()
);

create index if not exists ct_user_idx on public.credit_transactions(user_id, created_at desc);
create index if not exists ct_reason_idx on public.credit_transactions(reason);
create index if not exists ct_expiry_idx on public.credit_transactions(expires_at) where expires_at is not null;
create unique index if not exists ct_dhmad_tx_uq on public.credit_transactions(dhmad_transaction_id) where dhmad_transaction_id is not null;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Jobs — transcription records (one row per upload)
--    Audio file lives in Cloudflare R2 at: captih-uploads/{user_id}/{job_id}.{ext}
-- ────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.job_status as enum ('queued', 'uploading', 'processing', 'done', 'failed');
exception when duplicate_object then null;
end $$;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.profiles(id) on delete cascade,  -- nullable for anonymous trial
  anonymous_token text,                                            -- hashed device+IP token for anonymous trial gating
  filename text not null,
  size_bytes bigint not null,
  duration_sec integer not null,
  status public.job_status not null default 'queued',
  language text not null default 'ar-TN',
  r2_object_key text,                                              -- key in the Cloudflare R2 bucket
  r2_deleted_at timestamptz,                                       -- when audio was purged from R2
  segments jsonb not null default '[]'::jsonb,                     -- the SRT segments themselves
  transcript text not null default '',                             -- joined plain text
  error_message text,
  minutes_charged integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz                                           -- transcript auto-purged 90 days after creation
);

create index if not exists jobs_user_idx on public.jobs(user_id, created_at desc);
create index if not exists jobs_anonymous_idx on public.jobs(anonymous_token, created_at desc) where anonymous_token is not null;
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_expiry_idx on public.jobs(expires_at) where expires_at is not null;

-- Link credit_transactions back to jobs
alter table public.credit_transactions
  drop constraint if exists ct_related_job_fk;
alter table public.credit_transactions
  add constraint ct_related_job_fk foreign key (related_job_id) references public.jobs(id) on delete set null;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Atomic credit operations — called from API routes with service role
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.grant_credits(
  p_user_id text,
  p_minutes integer,
  p_reason public.credit_reason,
  p_pack_id text default null,
  p_custom_minutes integer default null,
  p_dhmad_tx text default null,
  p_expires_at timestamptz default null
) returns public.credit_transactions language plpgsql security definer set search_path = public as $$
declare
  new_balance integer;
  tx public.credit_transactions;
begin
  if p_minutes <= 0 then raise exception 'p_minutes must be positive'; end if;

  insert into public.credits (user_id, balance_minutes)
  values (p_user_id, p_minutes)
  on conflict (user_id) do update
    set balance_minutes = public.credits.balance_minutes + excluded.balance_minutes,
        updated_at = now()
  returning balance_minutes into new_balance;

  insert into public.credit_transactions (
    user_id, amount_minutes, reason, balance_after,
    pack_id, custom_minutes, dhmad_transaction_id, expires_at
  ) values (
    p_user_id, p_minutes, p_reason, new_balance,
    p_pack_id, p_custom_minutes, p_dhmad_tx, p_expires_at
  ) returning * into tx;

  return tx;
end;
$$;

-- Atomic debit on job completion — fails with INSUFFICIENT_CREDITS if balance too low
create or replace function public.debit_credits_for_job(
  p_user_id text,
  p_job_id uuid,
  p_minutes integer
) returns public.credit_transactions language plpgsql security definer set search_path = public as $$
declare
  new_balance integer;
  tx public.credit_transactions;
begin
  if p_minutes <= 0 then raise exception 'p_minutes must be positive'; end if;

  update public.credits
    set balance_minutes = balance_minutes - p_minutes,
        updated_at = now()
    where user_id = p_user_id and balance_minutes >= p_minutes
    returning balance_minutes into new_balance;

  if new_balance is null then
    raise exception 'INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;

  insert into public.credit_transactions (
    user_id, amount_minutes, reason, balance_after, related_job_id
  ) values (
    p_user_id, -p_minutes, 'transcription_debit', new_balance, p_job_id
  ) returning * into tx;

  update public.jobs set minutes_charged = p_minutes where id = p_job_id;

  return tx;
end;
$$;

create or replace function public.refund_job_credits(
  p_user_id text,
  p_job_id uuid,
  p_minutes integer,
  p_reason text default 'transcription failure'
) returns public.credit_transactions language plpgsql security definer set search_path = public as $$
declare
  new_balance integer;
  tx public.credit_transactions;
begin
  if p_minutes <= 0 then raise exception 'p_minutes must be positive'; end if;

  insert into public.credits (user_id, balance_minutes)
  values (p_user_id, p_minutes)
  on conflict (user_id) do update
    set balance_minutes = public.credits.balance_minutes + excluded.balance_minutes,
        updated_at = now()
  returning balance_minutes into new_balance;

  insert into public.credit_transactions (
    user_id, amount_minutes, reason, balance_after, related_job_id
  ) values (
    p_user_id, p_minutes, 'refund', new_balance, p_job_id
  ) returning * into tx;

  update public.jobs
    set status = 'failed', error_message = p_reason,
        completed_at = now(), minutes_charged = 0
    where id = p_job_id;

  return tx;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. RLS — Clerk user ID is read from the JWT 'sub' claim
--    All anon-key requests must use a Clerk-signed JWT (we configure this in
--    Clerk → JWT Templates → "supabase" template).
-- ────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.jobs enable row level security;

-- Helper: pull the Clerk user ID out of the JWT
create or replace function public.clerk_user_id() returns text
language sql stable as $$
  select coalesce(auth.jwt() ->> 'sub', '');
$$;

drop policy if exists "profiles: own row read"    on public.profiles;
drop policy if exists "profiles: own row update"  on public.profiles;
drop policy if exists "credits: own row read"     on public.credits;
drop policy if exists "ct: own rows read"         on public.credit_transactions;
drop policy if exists "jobs: own rows read"       on public.jobs;
drop policy if exists "jobs: own rows update"     on public.jobs;
drop policy if exists "jobs: own rows insert"     on public.jobs;
drop policy if exists "jobs: own rows delete"     on public.jobs;

create policy "profiles: own row read"
  on public.profiles for select using (id = public.clerk_user_id());

create policy "profiles: own row update"
  on public.profiles for update using (id = public.clerk_user_id());

create policy "credits: own row read"
  on public.credits for select using (user_id = public.clerk_user_id());

create policy "ct: own rows read"
  on public.credit_transactions for select using (user_id = public.clerk_user_id());

create policy "jobs: own rows read"
  on public.jobs for select using (user_id = public.clerk_user_id());

create policy "jobs: own rows update"
  on public.jobs for update using (user_id = public.clerk_user_id());

create policy "jobs: own rows insert"
  on public.jobs for insert with check (user_id = public.clerk_user_id());

create policy "jobs: own rows delete"
  on public.jobs for delete using (user_id = public.clerk_user_id());

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Scheduled cleanup
-- ────────────────────────────────────────────────────────────────────────────

select cron.schedule(
  'captih-purge-old-transcripts',
  '0 3 * * *',
  $$delete from public.jobs where expires_at is not null and expires_at < now()$$
);

select cron.schedule(
  'captih-expire-custom-credits',
  '15 3 * * *',
  $$
  do $body$
  declare
    rec record;
  begin
    for rec in
      select user_id, sum(amount_minutes) as expired_total
      from public.credit_transactions
      where reason = 'custom_purchase'
        and expires_at is not null
        and expires_at < now()
        and not exists (
          select 1 from public.credit_transactions x
          where x.reason = 'expiry'
            and x.user_id = credit_transactions.user_id
            and x.created_at > credit_transactions.expires_at
        )
      group by user_id
    loop
      update public.credits
        set balance_minutes = greatest(0, balance_minutes - rec.expired_total),
            updated_at = now()
        where user_id = rec.user_id;
      insert into public.credit_transactions (user_id, amount_minutes, reason, balance_after)
      select rec.user_id, -rec.expired_total, 'expiry', balance_minutes
      from public.credits where user_id = rec.user_id;
    end loop;
  end
  $body$;
  $$
);
