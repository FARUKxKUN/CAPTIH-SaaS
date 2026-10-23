# Database (Supabase Postgres)

captih uses Supabase only as a Postgres database. Authentication is handled by Clerk, and all data access goes through server-side API routes using the service role key. Row Level Security is enabled on every table and denies direct access from the public client.

## Applying the schema

Run the files in [`migrations/`](./migrations/) in the Supabase SQL editor, in this order:

| # | File | What it does |
|---|---|---|
| 1 | `20260602_init_captih_schema.sql` | Core tables, indexes, triggers and the credit SQL functions |
| 2 | `20260602_auth_user_sync.sql` | Early Supabase-auth user sync (removed again by step 3) |
| 3 | `20260603_clerk_text_ids.sql` | Switches user ids to Clerk's text ids and recreates RLS policies |
| 4 | `20260603_clerk_text_functions.sql` | Recreates the credit functions for text user ids |
| 5 | `001_rate_limits.sql` | Rate-limit table used by the API |
| 6 | `20260618_fix_rate_limits_shape.sql` | Makes sure the rate-limit table has the right columns (safe to re-run) |

Steps 2 and 3 record the move from Supabase Auth to Clerk. On a fresh project you still run them in order.

## Tables

| Table | Purpose |
|---|---|
| `users` | One row per Clerk user, created and updated by the signed Clerk webhook |
| `credits` | Minute packs. `minutes_remaining` is a generated column, `expires_at` is null for the free tier |
| `jobs` | One row per transcription: status, duration, minutes charged, transcript text and JSON (`{ words, captions }`) |
| `transactions` | Audit trail for every credit change: purchases (with payment id), deductions, refunds |
| `rate_limits` | Fixed-window counters keyed by action and IP or user (`key`, `hits`, `reset_at`) |

## SQL functions

| Function | Used for |
|---|---|
| `get_user_active_minutes(user_id)` | Sum of unexpired remaining minutes across a user's packs |
| `deduct_credit_minutes(user_id, minutes)` | Charges the soonest-expiring active pack (it may go negative; the balance sum stays correct). Returns false if the user has no active pack. The API checks the balance before calling it |

## Retention

Uploaded audio is streamed to the inference endpoint and is not written to storage by the app. A trigger stamps `audio_delete_after` (90 days after completion) on each job for retention cleanup.
