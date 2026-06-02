# Captih — Supabase setup

> 30-minute walkthrough from zero to working auth + DB + credits + jobs.

## 1. Create the Supabase project

1. Go to https://supabase.com → **New Project**
2. Name: `captih-prod` (or `captih-dev` for a staging copy)
3. Database password: generate + save to a password manager
4. Region: **Frankfurt** (eu-central-1) — closest to Tunis with low latency
5. Plan: **Free** tier is fine for v1 launch (500 MB DB, 1 GB storage, 50k MAU)

## 2. Apply the schema

1. Open the new project → **SQL Editor** → **New Query**
2. Paste the full contents of [`supabase/schema.sql`](./schema.sql)
3. Click **Run** (cmd+enter)
4. Verify: **Table Editor** should now show `profiles`, `credits`, `credit_transactions`, `jobs`

## 3. Configure auth

1. **Authentication** → **Providers** → **Email** → confirm "Email" is ON
2. **Settings** → tick "Enable email confirmations" (per spec — email verification required)
3. **URL Configuration** → set Site URL to `http://localhost:3000` (dev) — add production URL later
4. **Email Templates** → optionally customize confirmation + magic link templates with brand colors (Studio Night `#0B0B0F` / saffron `#FF5C2B`)

## 4. Create the storage bucket

1. **Storage** → **New bucket**
2. Name: `captih-uploads`
3. **Public bucket**: OFF (uploads are user-private)
4. **File size limit**: `500` MB
5. **Allowed MIME types**: `audio/*, video/*`
6. After creation → **Policies** tab → add three policies (use the templates):
   - **Upload to own folder**: `auth.uid()::text = (storage.foldername(name))[1]` on INSERT
   - **Read own files**: same expression on SELECT
   - **Delete own files**: same expression on DELETE

User uploads will go to `captih-uploads/{user_id}/{job_id}.{ext}`.

## 5. Get the keys

**Project Settings** → **API**:

| Key | Where it goes |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` *(server-only, never expose)* |

Paste into `.env.local` (copy from `.env.example`).

## 6. Verify it works

```bash
pnpm dev
```

Visit `http://localhost:3000/signup` → create an account → check:
- Supabase **Authentication** → **Users** shows the new user
- **Table Editor** → `profiles` shows a row with the user's email
- **Table Editor** → `credits` shows `balance_minutes: 3` (free-trial seed)
- **Table Editor** → `credit_transactions` shows a `free_trial_grant` row

If all four are true, the schema + trigger are wired correctly.

## Schema tables at a glance

| Table | Purpose |
|---|---|
| `profiles` | Public mirror of `auth.users` with display fields |
| `credits` | Current minute balance per user (one row each) |
| `credit_transactions` | Every credit change — audit trail, dispute reference, billing source-of-truth |
| `jobs` | One row per upload — segments stored inline as JSONB |

## Database functions you'll call from the app

| Function | When |
|---|---|
| `grant_credits(user_id, minutes, reason, pack_id, ...)` | Dhmad webhook → user paid → grant minutes |
| `debit_credits_for_job(user_id, job_id, minutes)` | Job completed → charge user, fails if insufficient (atomic) |
| `refund_job_credits(user_id, job_id, minutes, reason)` | Transcription failed → refund + mark job failed |

All three are `security definer` so they bypass RLS — only callable from the server via the service role key.

## Scheduled jobs (`pg_cron`)

| Schedule | Job |
|---|---|
| Daily 03:00 UTC | Delete transcripts with `expires_at < now()` (90-day retention) |
| Daily 03:15 UTC | Expire custom-purchase credits past their 30-day window |

View schedules: `select * from cron.job;`

## When something goes wrong

- **Trigger didn't fire on signup** → `select * from public.profiles;` empty? Check `select prosrc from pg_proc where proname = 'handle_new_user';` — the function might have errored.
- **User can't see their own jobs** → RLS policy check: `select * from pg_policies where tablename = 'jobs';`
- **Credit grant didn't add up** → Inspect: `select * from public.credit_transactions where user_id = '...' order by created_at desc;`

## TypeScript types

The schema is mirrored in [`src/lib/types/database.ts`](../src/lib/types/database.ts) (created in the next step of integration).

When you change the schema, also update those types. Or generate them automatically:

```bash
npx supabase gen types typescript --project-id YOUR-PROJECT-REF > src/lib/types/database.ts
```
