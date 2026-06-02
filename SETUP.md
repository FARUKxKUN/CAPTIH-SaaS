# Captih — Production setup checklist

> One-time setup of all 8 integrations. Follow in order — each step is gated on the previous one. Budget: ~90 minutes.

| # | Step | Time | Status |
|---|---|---|---|
| 1 | Buy `captih.com` (or `captih.ai`) | 5 min | ☐ |
| 2 | Create Supabase project + run schema | 15 min | ☐ |
| 3 | Create Clerk app + JWT template + webhook | 20 min | ☐ |
| 4 | Create Cloudflare R2 bucket + API token | 10 min | ☐ |
| 5 | Create Upstash Redis DB | 5 min | ☐ |
| 6 | Add Cloudflare Turnstile site | 5 min | ☐ |
| 7 | Create PostHog project | 5 min | ☐ |
| 8 | Set up Resend domain | 10 min | ☐ |
| 9 | Sign up for Dhmad.tn merchant account | external | ☐ |
| 10 | Deploy FARUKxAUTO to Modal | external | ☐ |
| 11 | Fill `.env.local` from `.env.example` | 5 min | ☐ |
| 12 | `pnpm dev` → smoke test signup → upload flow | 10 min | ☐ |

---

## 1. Domain

Register `captih.com` via Cloudflare Registrar (cheapest, no markup, auto-DNS).
Add A/AAAA records pointing to Vercel later.

## 2. Supabase — Domain DB only (no auth)

Detailed steps in [`supabase/README.md`](./supabase/README.md). TL;DR:

1. supabase.com → New project → region **eu-central-1** (Frankfurt)
2. SQL Editor → paste [`supabase/schema.sql`](./supabase/schema.sql) → Run
3. Project Settings → API → copy URL + anon key + service-role key
4. Paste into `.env.local`

> ⚠️ **Don't** enable Supabase Auth UI. Clerk handles all auth.

## 3. Clerk — Auth provider

1. clerk.com → New application → name `Captih`
2. **Enable**: Email, Google (most Tunisians have Gmail). Tick "passkeys" — free MFA-equivalent
3. **API Keys** → copy publishable + secret → paste into `.env.local`
4. **JWT Templates** → **New Template** → name `supabase`
   - Set issuer to your Supabase URL
   - Add claim: `"role": "authenticated"`
   - Save the JWT signing key — paste it into Supabase **Project Settings → Auth → JWT Secret** (this is what lets Supabase verify Clerk's JWTs)
5. **Webhooks** → **Add Endpoint** → URL: `https://YOUR_DOMAIN/api/clerk-webhook`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy signing secret → paste into `CLERK_WEBHOOK_SECRET`
6. **Customization** → **Appearance** → Dark theme + primary color `#FF5C2B` (saffron) to match brand

## 4. Cloudflare R2 — Audio storage

1. dash.cloudflare.com → **R2** → Create bucket: `captih-uploads`
2. Bucket settings → CORS:
   ```json
   [
     {
       "AllowedOrigins": ["https://captih.com", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. **Manage R2 API Tokens** → Create → permissions: Object Read & Write, scope: `captih-uploads`
4. Copy Access Key ID + Secret + Account ID → paste into `.env.local`
5. *(Optional)* Custom domain: add `audio.captih.com` for prettier URLs

## 5. Upstash Redis — Rate limiting

1. upstash.com → **Redis** → Create database
2. Region: **eu-west-1** (closest to Tunis with good Vercel peering)
3. Type: **Regional** (cheaper than Global, plenty for v1)
4. Copy REST URL + REST Token → paste into `.env.local`

## 6. Cloudflare Turnstile — CAPTCHA

1. dash.cloudflare.com → **Turnstile** → Add Site
2. Domain: `captih.com` (add `localhost` for dev)
3. Widget mode: **Invisible** (zero UX friction)
4. Copy Site Key (public) + Secret Key → paste into `.env.local`

## 7. PostHog — Analytics + session replay

1. posthog.com → Sign up → Region: **EU** (GDPR-friendly for your Tunisian audience)
2. **Project Settings** → copy Project API Key → paste into `.env.local`
3. Optional: **Session Recordings** → enable; set sample rate 100% for v1 to debug everything

## 8. Resend — Email

1. resend.com → API Keys → Create
2. **Domains** → Add `captih.com` → add DNS records to Cloudflare (auto-detected if domain is on CF)
3. Wait for DNS verification (~5 min)
4. Copy API key → paste into `.env.local`
5. Set `RESEND_FROM_EMAIL=noreply@captih.com` (or whatever local-part you prefer)

## 9. Dhmad.tn — Payment

External to this checklist — Faruk knows the owner. Once you have:
- Merchant ID
- API Key
- Webhook signing secret
- Webhook URL → set to `https://captih.com/api/dhmad-webhook`

Paste credentials into `.env.local`. The adapter pattern in `src/lib/payments/dhmad.ts` (to be built) will handle the rest.

## 10. Modal — FARUKxAUTO endpoint

External — see `tunisian_asr_roadmap.html` in the Kalimtu repo for the model training pipeline. Once deployed:

- Endpoint URL → `MODAL_TRANSCRIBE_URL`
- Bearer token → `MODAL_TRANSCRIBE_TOKEN`

The `/api/transcribe` stub swaps to the real call by replacing `mockSegments()` with `fetch(MODAL_TRANSCRIBE_URL, ...)`.

## 11. `.env.local`

```bash
cp .env.example .env.local
# Edit .env.local — fill every YOUR_X with the real values from the steps above
```

## 12. Smoke test

```bash
pnpm dev
```

1. Visit `http://localhost:3000` → landing should render
2. Visit `/sign-up` → Clerk widget appears → sign up with a real email
3. Check Clerk dashboard → user appears
4. Check Supabase `profiles` table → row appears (via webhook)
5. Check Supabase `credits` table → row with `balance_minutes: 3`
6. Visit `/transcribe` → drop a real audio file → confirm flow ends at `/result/[id]` with downloads

If all 6 work, **you're production-ready** (modulo Modal + Dhmad).

---

## When something breaks

| Symptom | Where to look |
|---|---|
| User signs up but no profile row | Clerk Webhooks → recent deliveries → check response. Verify `CLERK_WEBHOOK_SECRET` matches. |
| Job appears but RLS denies | Supabase logs → check JWT `sub` claim matches profile ID. Re-check JWT template in Clerk. |
| Upload to R2 fails CORS | R2 CORS config — must include exact origin including protocol |
| Rate limit not enforcing | Upstash console → check command count; verify `.env` URL has `https://` |
| Email not sending | Resend dashboard → check DNS verification status; verify domain |

---

## Recurring costs at scale

| Service | Free tier | Cost above |
|---|---|---|
| Vercel | Hobby unlimited | Pro $20/mo above 1 TB bandwidth |
| Supabase | 500 MB DB + 1 GB storage | Pro $25/mo |
| Clerk | 10k MAU | $0.02 per MAU above |
| Cloudflare R2 | 10 GB + 10M reads + 0 egress | $0.015/GB above |
| Upstash | 10k commands/day | $0.20 per 100k commands |
| Turnstile | unlimited | always free |
| PostHog | 1M events/mo | $0.00031 per event above |
| Resend | 3k emails/mo | $20/mo for 50k |
| Modal | $30/mo free credit | $1.10/hr A10G GPU |
| Dhmad.tn | — | ~5% per transaction |

**At 100 paying users / month** with realistic usage: total infra cost ~$0–10/month. Pure margin until ~1000 paying users.
