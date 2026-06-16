# CAPTIH Backend Setup Guide

Complete checklist to get the CAPTIH backend production-ready.

---

## ✅ Phase 1: Database & Schema (COMPLETE)

### What's Done:
- ✅ Supabase project created (`https://ahklqomuchgdxgdbliw.supabase.co`)
- ✅ Database schema deployed (`supabase/migrations/20260602_init_captih_schema.sql`)
- ✅ Tables created: `users`, `jobs`, `credits`, `transactions`, `rate_limits`
- ✅ RLS policies enabled (users see only their data)
- ✅ Helper functions: `get_user_active_minutes()`, `deduct_credit_minutes()`
- ✅ Indexes optimized for performance
- ✅ Triggers auto-update timestamps

**Verification:**
Go to [Supabase Dashboard → Database](https://supabase.com/dashboard/project/ahklqomuchgdxgdbliw/editor) and confirm all tables exist.

---

## ✅ Phase 2: API Endpoints (COMPLETE)

### Files Created:

| File | Purpose |
|------|---------|
| `src/lib/supabase-server.ts` | Server-side Supabase client |
| `src/lib/credit-system.ts` | Credit deduction & balance logic |
| `src/lib/job-system.ts` | Job creation & status updates |
| `src/app/api/transcribe/route-new.ts` | Upload handler (stub) |
| `src/app/api/credits/route.ts` | GET balance, POST purchase |
| `src/app/api/jobs/route.ts` | GET user's jobs list |
| `src/app/api/jobs/[id]/route.ts` | GET specific job details |
| `src/app/api/webhooks/dhmad/route.ts` | Payment webhook handler |

**Endpoints ready:**
- `POST /api/transcribe` — Upload video/audio
- `GET /api/credits` — Get balance
- `POST /api/credits/purchase` — Create credit pack
- `GET /api/jobs` — List user's jobs
- `GET /api/jobs/[id]` — Get job details
- `POST /api/webhooks/dhmad` — Payment callback

---

## ⏳ Phase 3: Environment Setup (TODO)

### 1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 2. Fill in Supabase keys (get from Dashboard → Settings → API):

```env
# Get these from Supabase Dashboard → Project Settings → API.
# Real values live in .env.local (gitignored) — never commit them.
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YOUR_KEY
SUPABASE_SERVICE_ROLE_KEY=sb_secret_YOUR_KEY
```

### 3. Dhmad.tn Setup (Faruk handles):

Contact Faruk to:
- Sign up for [Dhmad.tn](https://dhmad.tn) merchant account
- Get merchant ID, API key, webhook secret
- Set webhook URL: `https://captih.com/api/webhooks/dhmad`

Then add to `.env.local`:
```env
DHMAD_MERCHANT_ID=xxxxx
DHMAD_API_KEY=xxxxx
DHMAD_WEBHOOK_SECRET=xxxxx
```

### 4. Modal Setup (Faruk handles):

Faruk deploys FARUKxAUTO to Modal. Once ready:

```env
MODAL_TRANSCRIBE_URL=https://xxx.modal.run/transcribe
MODAL_TRANSCRIBE_TOKEN=xxxxx
```

Then update `src/app/api/transcribe/route-new.ts` to call Modal instead of mock.

### 5. Resend Email Setup (Optional for MVP):

1. Sign up at [Resend](https://resend.com)
2. Create API key and verified sender domain
3. Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@captih.com
```

### 6. Clerk Setup (Frontend handles):

Should already be in `.env.local`. Verify:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_SECRET
```

---

## ⏳ Phase 4: Integration Tasks (TODO)

### 4a. Wire Real Transcribe Endpoint

**Currently:** `/api/transcribe` returns mock SRT

**When Modal is ready:**
1. Replace mock implementation in `src/app/api/transcribe/route-new.ts`
2. Call `MODAL_TRANSCRIBE_URL` with audio file
3. Parse Modal's Whisper output → SrtSegment format

**File to update:** `src/app/api/transcribe/route-new.ts` (lines 180-200)

### 4b. Connect Dhmad Payment

**Currently:** `/api/credits/purchase` is a stub endpoint

**When Dhmad is set up:**
1. Frontend redirects to Dhmad checkout (handled by Faruk)
2. Dhmad sends webhook to `/api/webhooks/dhmad` on success
3. Backend creates credits atomically

**No code changes needed** — webhook is already wired!

### 4c. Email Notifications

**Create Resend email templates:**
- `src/emails/credit-purchase.tsx` — Order confirmation
- `src/emails/job-complete.tsx` — "Your transcript is ready"
- `src/emails/job-failed.tsx` — "We couldn't process your file, minutes refunded"

Then trigger from:
- `src/lib/credit-system.ts` (on purchase)
- `src/app/api/transcribe/route-new.ts` (on completion/failure)

### 4d. Rate Limiting (Production)

**Current:** In-memory per-instance (not scalable)

**Switch to Upstash:**
```bash
npm install @upstash/redis
```

Then update `src/lib/rate-limit.ts` (create new file):
```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkRateLimit(ip: string) {
  // Implementation
}
```

---

## ⏳ Phase 5: Testing & Deployment (TODO)

### Local Testing

1. Start dev server:
```bash
npm run dev
```

2. Test upload endpoint:
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -H "Authorization: Bearer <clerk_token>" \
  -F "file=@test.mp3" \
  -F "durationSec=60"
```

3. Check credits:
```bash
curl http://localhost:3000/api/credits \
  -H "Authorization: Bearer <clerk_token>"
```

### Deploy to Production

1. Push to main branch
2. Vercel auto-deploys (via GitHub integration)
3. Set production environment variables in Vercel dashboard
4. Monitor logs via Vercel → Functions

---

## 📋 Checklist

### Immediate (This Sprint)
- [ ] Fill `.env.local` with Supabase keys ✅ (keys provided)
- [ ] Test API locally with mock endpoint
- [ ] Verify Supabase RLS policies work
- [ ] Create Resend templates

### Short-term (Before Launch)
- [ ] Dhmad.tn merchant account (Faruk)
- [ ] Modal deployment of FARUKxAUTO (Faruk)
- [ ] Wire real transcribe endpoint
- [ ] Wire Dhmad webhook
- [ ] Email confirmations working
- [ ] Upstash Redis setup (if scaling)

### Pre-Launch
- [ ] Load test with 10 concurrent uploads
- [ ] Test payment flow end-to-end
- [ ] Test refund flow (transcription failure)
- [ ] Verify file cleanup (90-day deletion works)
- [ ] Check error messages are user-friendly

### Post-Launch (v1.1)
- [ ] Usage analytics dashboard
- [ ] Custom credit packs UI
- [ ] Email templates for all scenarios
- [ ] API rate limiting per user (not just IP)
- [ ] Support for Egyptian/Levantine dialects

---

## 🔑 API Reference

See `API.md` for complete endpoint documentation.

**Quick overview:**
- Upload: `POST /api/transcribe`
- Get balance: `GET /api/credits`
- Buy credits: `POST /api/credits/purchase`
- List jobs: `GET /api/jobs`
- Get job details: `GET /api/jobs/[id]`

---

## 🐛 Debugging

### Supabase Logs
Dashboard → Logs → select table/function to monitor

### API Errors
- Check Vercel logs: `vercel logs`
- Check browser console (client errors)
- Check server logs: `npm run dev` output

### Credit Deduction Issues
```sql
-- Check if credits are being deducted
SELECT * FROM public.credits WHERE user_id = 'user_id' ORDER BY created_at DESC;

-- Check transaction history
SELECT * FROM public.transactions WHERE user_id = 'user_id' ORDER BY created_at DESC;
```

### Job Status Stuck
```sql
-- Reset stuck job to failed
UPDATE public.jobs SET status = 'failed', error_message = 'Timeout' WHERE id = 'job_id';

-- Refund minutes
UPDATE public.credits SET minutes_used = 0 WHERE user_id = 'user_id' AND pack_type = 'free';
```

---

## 📚 Related Docs

- [API.md](./API.md) — Complete endpoint reference
- [CAPTIH-V1-SPEC.md](./CAPTIH-V1-SPEC.md) — Product spec (locked)
- [STT-SAAS.md](./STT-SAAS.md) — Product positioning
- [supabase/migrations/](./supabase/migrations/) — Database migrations

---

## 💬 Questions?

- **Supabase issues?** Check [Supabase Docs](https://supabase.com/docs)
- **Clerk auth?** Check [Clerk Docs](https://clerk.com/docs)
- **Next.js API routes?** Check [Next.js Docs](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- **Something else?** Ask Faruk or check GitHub issues

---

**Status: BACKEND READY FOR TESTING** ✅

Next step: Fill env vars and test locally!
