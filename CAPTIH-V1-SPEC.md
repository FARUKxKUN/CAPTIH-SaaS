# Captih v1 — Locked Spec

> Single source of truth for what Captih ships on day one. Locked via /grill-me on 2026-05-31. Any change here needs explicit Faruk approval — don't drift from this in code.

---

## North star

**Target user:** Tunisian influencers (Reels / TikTok / YouTube Shorts creators) who need captions for short-form videos. Mental model: "1 DT per reel."

**Mission for v1:** Ship a working product that lets a Tunisian influencer drop a Reel, get a perfect SRT, and pay only for what they use. No subscriptions. No friction.

---

## Pricing — locked

### Free
- **3 minutes lifetime** (per account, not per month)
- No card required
- Purpose: quality test, not real usage

### Packs (1-year validity — "show a little 'expires next year' tag")
| Pack | Price | DT/min | Discount vs buying 10-packs |
|---|---|---|---|
| **10 min** | 10 DT | 1.00 | — *(1 DT per reel anchor)* |
| **30 min** | 22 DT | 0.73 | Save 8 DT (27%) |
| **60 min** | 38 DT | 0.63 | Save 22 DT (37%) |
| **180 min** | 88 DT | 0.49 | Save 92 DT (51%) |

### Custom (1h–30h, 30-day expiry)
| Range | Rate |
|---|---|
| 60–300 min | 0.70 DT/min |
| 301–900 min | 0.55 DT/min |
| 901–1800 min | 0.45 DT/min |
| Floor | 0.45 DT/min |

User types in a specific number (60–1800). Live price computed by tier. Minutes expire 30 days from purchase.

### Unit economics
- Cost: 0.021 DT/min (Modal A10G at $1/h, ~5x realtime, + cold-start amortization)
- Payment fee: 5% (Dhmad.tn)
- **All cells ≥ 85% net margin. Smallest pack = 93%. Floor = 90%.**

### Out-of-credit flow
Block upload → modal: "Out of minutes. Top up?" with 4 packs as quick-buy.

---

## Auth — locked

- **Email + password** (mirror Kalimtu's Supabase pattern, fastest to copy)
- Email verification + IP rate-limit for abuse prevention
- Free trial flow: **anonymous upload → see result → "Sign up to download/edit"** (highest conversion pattern, cookie/IP gates abuse)

---

## Upload — locked

- **Max:** 30 min duration / 500 MB file
- **Accepted formats:** MP4, MOV, MP3, WAV, M4A, WebM
- **Video files:** auto-extract audio server-side (ffmpeg)
- **Mobile-first:** gallery picker works, touch-friendly drop zone

---

## Processing UX — locked

- Stay on page with progress bar (waveform animation + percentage)
- Can close tab and come back via email link
- Typical processing: 1–5 min per file
- Email when done if user left

---

## Result page — locked

- **Preview pane** (first ~30 lines of transcript)
- **Download SRT button** (saffron, primary)
- **Download TXT button** (saffron, equal weight)
- **"Open in editor" button** (white, paid users only)
- **"Re-transcribe" link** (charges again)

User picks SRT or TXT at download time (both available, not chosen at upload).

---

## Inline editor — locked

**Scope for v1:**
- **Edit text only** (no timestamp editing, no speakers, no find-replace)
- Side-by-side: timestamps left (read-only) / Arabic text right (editable)
- Tab between segments
- Auto-save
- Available to **all paid users** (any pack or custom purchase) — not free tier

---

## Dashboard — locked

**Layout:**
- **Top:** credit balance ("47 minutes left") + "Transcribe new" CTA
- **Middle:** recent jobs list (last 10) — filename, duration, date, status, [Open]/[Re-download]
- **Sidebar:** Account / Billing / Logout

**New user empty state:** giant "Drop your first file" upload zone instead of empty jobs list.

---

## File retention — locked

| Asset | Retention |
|---|---|
| **Audio uploaded** | Deleted immediately after processing completes |
| **Transcripts (SRT/TXT)** | Kept 90 days, then auto-delete unless user explicitly saved |
| **Account data** | Until user requests deletion (GDPR-clean) |

---

## Error handling — locked

**Failed transcription** (empty output / garbage / silence detected):
- Refund the minutes automatically
- Show: "We couldn't hear anything in your file. Minutes refunded. Try a clearer recording?"
- Trust-positive default

---

## Tech stack — locked

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 16 App Router + Tailwind v4 | Already built |
| Auth + DB | Supabase | Mirror Kalimtu's pattern |
| File storage | Supabase Storage (temp) | Auto-delete via job |
| Transcription | Modal — FARUKxAUTO | $1/hr A10G, pay-per-use |
| Audio extraction | ffmpeg server-side | Lambda or Modal worker |
| Payment | **Dhmad.tn** | Faruk handles integration externally; we use Kalimtu's tier-pattern with adapter |
| Email | Resend | Transactional only |
| 3D logo | React Three Fiber | Already built |

---

## What's NOT in v1 (explicitly deferred)

- ❌ Monthly subscriptions (dropped entirely — Faruk's call: audience doesn't subscribe)
- ❌ Speaker labels
- ❌ Burned-in captions on MP4
- ❌ URL paste (YouTube/TikTok scrape)
- ❌ Team accounts / multi-user
- ❌ API access
- ❌ Custom vocabulary
- ❌ Editor: timestamp editing, find/replace, undo/redo
- ❌ Usage analytics chart on dashboard
- ❌ Multi-language UI (English only at launch; Arabic + French in v1.1)

---

## v1 build order

1. **Pricing UI in code** ✅ (done 2026-05-31)
2. **Supabase setup** — auth + DB schema (users, credits, jobs, transactions)
3. **/transcribe** — anonymous upload + drag-drop + progress + "sign up to download" gate
4. **/result/[id]** — preview + download buttons + open-in-editor
5. **/editor/[id]** — text-only inline editor with auto-save
6. **/dashboard** — credit balance + jobs list + empty state
7. **/api/transcribe** — stub returning realistic SRT (until Modal endpoint ready)
8. **Dhmad.tn payment adapter** — webhook handler updates credit balance
9. **Modal endpoint** — deploy FARUKxAUTO, swap stub for real call

---

## Open items for Faruk to resolve externally

- Buy `captih.com` domain (lead) or `captih.ai`/`captih.app`
- Sign up for Dhmad.tn merchant account, get API keys
- Deploy FARUKxAUTO to Modal (separate workstream)
- Decide email sender domain (e.g., `noreply@captih.com`) for Resend

---

*Locked 2026-05-31. All decisions made via /grill-me interactive session. Override only with explicit "change X to Y" instruction from Faruk.*
