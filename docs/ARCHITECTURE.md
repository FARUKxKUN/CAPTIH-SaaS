# captih architecture

This document covers how a file becomes a subtitle track, how money and minutes move, and how the app is secured. For the overview, see the [README](../README.md).

## System overview

```
                    ┌────────────────────────────── Vercel ──────────────────────────────┐
 Browser ──────────▶│ proxy.ts  (Clerk auth gate + per-request nonce CSP)                │
   │                │   │                                                                │
   │                │   ├─ Pages: landing, examples, pricing, transcribe, result,        │
   │                │   │         dashboard, editor                                      │
   │                │   └─ API routes ──┬──▶ Supabase Postgres (service role, RLS on)    │
   │                └───────────────────┼────────────────────────────────────────────────┘
   │                                    ├──▶ Modal GPU endpoint: FARUKxAUTO (Whisper large-v3)
   │                                    ├──▶ Gemini 2.5 Flash (proofreading)
   │                                    └──▶ Dhmad.tn (escrow + checkout)
   │
   ├──▶ Clerk (sign-in UI)   ── user.* webhooks ──▶ /api/clerk-webhook
   └──▶ Dhmad checkout page  ── escrow webhooks ──▶ /api/webhooks/dhmad
```

All database access happens on the server with the Supabase service role key. The browser never queries tables directly, and RLS policies deny the anonymous role on every table as a second layer.

## The transcription pipeline

`POST /api/transcribe` ([source](../src/app/api/transcribe/route.ts)) handles one file end to end:

1. **Guards, cheapest first.** Same-origin check, then a per-IP rate limit (5 requests per minute), then Clerk auth, then a `Content-Length` check before the body is buffered.
2. **File validation.** Size (500 MB cap), a MIME allow-list, and magic-byte sniffing of the first 16 bytes, so a renamed executable is rejected even if it claims to be `audio/mpeg`.
3. **Reserve minutes.** The client-declared duration (capped at 30 minutes) is used for an up-front balance check. A job row is created and minutes are deducted. If a parallel request spent them first, the job fails with `402`.
4. **Inference.** The file is posted to the Modal endpoint, which returns word-level segments with timestamps.
5. **Empty output means a refund.** If the model hears nothing, the minutes are refunded and the user gets a clear message (`422`).
6. **Billing reconciliation.** The real duration is the last word's end time. If the client under-declared, the difference is collected. This closes the "claim a 30-minute file is 1 second long" hole.
7. **Proofreading with a guard.** Gemini receives the ordered word list and must return the same number of items with the same indexes. Any mismatch, error or timeout (30 s) keeps the original words. The cleanup can make the transcript better, never worse. ([source](../src/lib/gemini-cleanup.ts))
8. **Captions.** Cleaned words are grouped into caption lines with default settings and stored as `{ words, captions }`. The result page regroups the stored words locally, by word count or character count, so changing caption style never re-runs inference. ([source](../src/lib/caption-format.ts))
9. **Any unexpected error** after minutes were deducted triggers an automatic refund.

The editor (`/editor/[id]`) edits caption text with a 500 ms debounced auto-save (`PATCH /api/jobs/[id]`). It keeps the original word list, so captions can still be re-formatted after editing.

## Credits and payments

Minutes are stored as **packs** (`credits` rows). Each pack has a size, a usage counter and an optional expiry. A user's balance is the sum of remaining minutes across unexpired packs. Every change is written to `transactions` as an audit trail.

**Free tier.** When Clerk sends `user.created`, the webhook creates the user row and grants a 3-minute pack with no expiry, once. Retries are idempotent.

**Buying a pack.**

```
Dashboard ──POST /api/payments/create──▶ pending transaction row
                                         Dhmad: create instant escrow (metadata: user, pack, txn)
                                         Dhmad: create checkout session ──▶ redirect URL
Browser ──▶ Dhmad checkout ──▶ pays
Dhmad ──escrow.status.updated = paid──▶ /api/webhooks/dhmad
                                         verify HMAC-SHA256 (timing-safe)
                                         reject if timestamp older than 5 minutes
                                         dedupe on webhook id
                                         match transaction by escrow id
                                         insert credit pack, mark transaction completed
                                         deliver escrow (releases funds)
```

The pack catalog lives in one place ([`src/lib/packs.ts`](../src/lib/packs.ts)). The amount charged is taken from the catalog on the server, never from the client. Credits are granted **only** by the verified webhook. There is no client-callable "add credits" endpoint.

## API reference

All routes return JSON. Errors use `{ "error": "<message>" }`. Authenticated routes use the Clerk session cookie.

| Method and path | Auth | Purpose |
|---|---|---|
| `POST /api/transcribe` | User | Multipart upload (`file`, optional `durationSec`). Returns `{ job }` with captions, words and transcript |
| `GET /api/jobs?limit=10` | User | The user's recent jobs (max 100) |
| `GET /api/jobs/:id` | Owner | One job |
| `PATCH /api/jobs/:id` | Owner | Save edited captions: `{ segments }` |
| `DELETE /api/jobs/:id` | Owner | Delete a job |
| `GET /api/credits` | User | Balance and pack list |
| `POST /api/payments/create` | User | `{ pack_type }`. Returns `{ url }` for the Dhmad checkout |
| `POST /api/webhooks/dhmad` | Signature | Payment events from Dhmad |
| `POST /api/clerk-webhook` | Signature (svix) | User lifecycle events from Clerk |

Status codes used by `/api/transcribe`: `401` not signed in, `402` out of minutes, `403` cross-origin, `413` too large, `415` unsupported or spoofed media, `422` nothing audible (refunded), `429` rate limited (with `Retry-After`), `500` failure (refunded).

## Security model

| Threat | Mitigation |
|---|---|
| XSS | Per-request nonce CSP with no `unsafe-inline` for scripts, an explicit allow-list for Clerk, Turnstile and PostHog, `object-src 'none'`, `frame-ancestors 'none'` |
| CSRF | Same-origin check on state-changing routes that move money or minutes; Clerk session cookies |
| Forged payments | HMAC signature, replay window, idempotency key, server-side pack pricing, credits granted only from the webhook |
| Billing abuse | Server-side reconciliation against real audio length; balance checks before work starts |
| Upload abuse | Rate limits backed by Postgres (shared across serverless instances), size limits before buffering, magic-byte checks |
| Data access | Service-role access on the server only; RLS on every table denies the public role; ownership checks on every job route |
| Transport and framing | HSTS with preload, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, restrictive Permissions-Policy |

The rate limiter fails open if the database is unreachable: a database outage should not lock paying users out. The trade-off is documented in [`src/lib/rate-limit-db.ts`](../src/lib/rate-limit-db.ts).

## Known limitations

- **Synchronous processing.** The whole pipeline runs inside one request, with a 300 s function limit and a 30-minute file cap. The planned design: upload straight to object storage, queue a job, run chunked inference in parallel on Modal, and notify the client by polling or webhook.
- **Upload path.** Files go through the API route. Very large files need direct-to-storage uploads with signed URLs to get around serverless body limits.
- **Duration probing.** Billing reconciles after inference. Probing with ffprobe before inference would let the app reject over-length files before spending GPU time.
- **Concurrent deductions.** Two simultaneous uploads from the same user can both pass the balance check. A row-locking deduction function would close this.
