# CAPTIH API Documentation

Complete backend API for the CAPTIH SaaS platform.

---

## Authentication

All endpoints require **Clerk authentication**. Include the Clerk session token in request headers.

Client-side: Clerk SDK automatically handles this
Server-side: Use `getAuth(request)` from `@clerk/nextjs/server`

---

## Endpoints

### 1. Transcription

#### `POST /api/transcribe`
Upload a video or audio file for transcription.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Auth: Required (Clerk)

**Body:**
```
- file: File (required) — MP4, MOV, MP3, WAV, M4A, WebM
- durationSec: number (optional) — Declared duration in seconds (max 30 min)
```

**Response (Success):**
```json
{
  "job": {
    "id": "uuid",
    "status": "completed",
    "durationSeconds": 120,
    "minutesCharged": 2,
    "srtContent": "1\n00:00:00,000 --> 00:00:05,000\nأهلا بيكم في الحلقة...",
    "transcriptText": "أهلا بيكم في الحلقة...\nاليوم باش نحكيو..."
  }
}
```

**Response (Insufficient Credits):**
```json
{
  "error": "Insufficient credits. Top up to continue."
}
```
Status: 402

**Response (Rate Limited):**
```json
{
  "error": "Too many requests. Slow down."
}
```
Status: 429

**Notes:**
- Max file size: 500 MB
- Max duration: 30 minutes
- Minutes charged = `ceil(duration_seconds / 60)`
- If transcription fails, minutes are auto-refunded
- File is stored temporarily, audio is deleted immediately after processing

---

### 2. Credits Management

#### `GET /api/credits`
Get user's credit balance and available packs.

**Request:**
- Method: `GET`
- Auth: Required (Clerk)

**Response:**
```json
{
  "user_id": "user_12345",
  "balance": 47,
  "packs": [
    {
      "id": "uuid",
      "pack_type": "free",
      "total_minutes": 3,
      "minutes_used": 0,
      "minutes_remaining": 3,
      "expires_at": null,
      "isActive": true,
      "expiresIn": null,
      "created_at": "2026-06-02T10:00:00Z"
    },
    {
      "id": "uuid",
      "pack_type": "pack_30",
      "total_minutes": 30,
      "minutes_used": 5,
      "minutes_remaining": 25,
      "expires_at": "2027-06-02T10:00:00Z",
      "isActive": true,
      "expiresIn": 525600,
      "created_at": "2026-06-02T10:05:00Z"
    }
  ]
}
```

---

#### `POST /api/credits/purchase`
Create a new credit pack (called after Dhmad.tn payment).

**Request:**
- Method: `POST`
- Auth: Required (Clerk)

**Body:**
```json
{
  "pack_type": "pack_30",
  "amount_dt": 22,
  "transaction_id": "dhmad_payment_12345"
}
```

**pack_type options:**
- `pack_10` — 10 minutes @ 10 DT (1 year validity)
- `pack_30` — 30 minutes @ 22 DT (1 year validity)
- `pack_60` — 60 minutes @ 38 DT (1 year validity)
- `pack_180` — 180 minutes @ 88 DT (1 year validity)
- `custom` — Custom minutes (30 days validity)

For `custom`, also include `minutes` field.

**Response:**
```json
{
  "success": true,
  "credit": {
    "id": "uuid",
    "pack_type": "pack_30",
    "total_minutes": 30,
    "expires_at": "2027-06-02T10:05:00Z"
  }
}
```
Status: 201

---

### 3. Jobs (Transcriptions)

#### `GET /api/jobs`
Get user's recent transcription jobs.

**Request:**
- Method: `GET`
- Query params:
  - `limit` (optional, default 10, max 100) — Number of jobs to return
- Auth: Required (Clerk)

**Response:**
```json
{
  "user_id": "user_12345",
  "jobs": [
    {
      "id": "uuid",
      "filename": "podcast_episode_1.mp4",
      "duration_seconds": 1200,
      "status": "completed",
      "minutes_charged": 20,
      "created_at": "2026-06-02T10:00:00Z",
      "processing_completed_at": "2026-06-02T10:05:00Z"
    }
  ]
}
```

---

#### `GET /api/jobs/[id]`
Get a specific job's details and transcription results.

**Request:**
- Method: `GET`
- Path params:
  - `id` (required) — Job UUID
- Auth: Required (Clerk)

**Response:**
```json
{
  "id": "uuid",
  "filename": "podcast_episode_1.mp4",
  "status": "completed",
  "duration_seconds": 1200,
  "minutes_charged": 20,
  "srt_content": "1\n00:00:00,000 --> 00:00:05,000\nأهلا بيكم في الحلقة...",
  "transcript_text": "أهلا بيكم في الحلقة...\nاليوم باش نحكيو...",
  "error_message": null,
  "created_at": "2026-06-02T10:00:00Z",
  "processing_completed_at": "2026-06-02T10:05:00Z"
}
```

**Job Status Values:**
- `pending` — Waiting to start processing
- `processing` — Currently transcribing
- `completed` — Done, SRT/transcript ready
- `failed` — Transcription failed (minutes refunded)

---

### 4. Webhooks

#### `POST /api/webhooks/dhmad`
Dhmad.tn payment webhook (internal — called by Dhmad).

**Headers Required:**
- `x-dhmad-signature` (HMAC-SHA256 of payload, signed with `DHMAD_WEBHOOK_SECRET`)

**Body:**
```json
{
  "id": "dhmad_payment_12345",
  "status": "completed",
  "amount": 22,
  "currency": "TND",
  "customer_email": "user@example.com",
  "metadata": {
    "user_id": "clerk_user_id",
    "pack_type": "pack_30"
  }
}
```

**Response:**
```json
{
  "received": true,
  "processed": true
}
```

**Notes:**
- Only processes `status: "completed"` events
- Verifies signature before processing
- Creates transaction and credit records atomically
- Auto-sends confirmation email (via Resend)

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

**Common HTTP Status Codes:**
- `200` — Success
- `201` — Created (used for /api/credits/purchase)
- `400` — Bad request (missing/invalid params)
- `401` — Unauthorized (no valid Clerk token)
- `402` — Payment required (insufficient credits)
- `403` — Forbidden (trying to access another user's job)
- `413` — Payload too large (file > 500 MB)
- `415` — Unsupported media type (wrong file format)
- `429` — Too many requests (rate limited)
- `500` — Server error

---

## Database Schema

See `supabase/migrations/20260602_init_captih_schema.sql` for complete schema.

**Key tables:**
- `users` — User profiles (synced from Clerk)
- `jobs` — Transcription attempts
- `credits` — User's credit packs
- `transactions` — Audit trail for all credit changes
- `rate_limits` — IP-based rate limiting

---

## Environment Variables

Required for backend:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

DHMAD_MERCHANT_ID=xxxxx
DHMAD_API_KEY=xxxxx
DHMAD_WEBHOOK_SECRET=xxxxx

MODAL_TRANSCRIBE_URL=https://xxx.modal.run/transcribe
MODAL_TRANSCRIBE_TOKEN=xxxxx

RESEND_API_KEY=re_xxxxx
```

---

## Implementation Notes

### Credit Deduction Logic
- When a user uploads, we check they have `ceil(duration / 60)` minutes available
- If yes, we deduct from the **oldest expiring pack first**
- Transaction is logged atomically
- If transcription fails, minutes are **auto-refunded**

### Rate Limiting
- Per-IP, per-minute: max 5 requests
- In-memory on Vercel (works per-instance)
- For production, migrate to Upstash Redis (included in env vars)

### File Storage
- Temporary files stored in Supabase Storage
- Audio deleted immediately after transcription
- SRT/transcripts kept for 90 days (auto-deleted via trigger)

### Integration Points

**Dhmad.tn Payment:**
1. User selects pack on `/dashboard`
2. Redirected to Dhmad checkout (external link)
3. Dhmad calls POST `/api/webhooks/dhmad` on success
4. Credits appear in user's account instantly

**Modal Transcription:**
1. Currently using mock (returns fake Darija SRT)
2. When Modal endpoint ready:
   - Update `/api/transcribe` to call `MODAL_TRANSCRIBE_URL`
   - Replace mock segments with real Modal response
   - Map Modal's output to SrtSegment format

**Resend Email:**
1. Triggered on:
   - Credit purchase confirmation
   - Job completion (if user left page)
   - Transcription failure (with refund notice)
2. Templates needed:
   - `credit_purchase.tsx`
   - `job_complete.tsx`
   - `job_failed.tsx`

---

## Testing

### Manual Testing

1. **Upload a file:**
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -H "Authorization: Bearer <clerk_token>" \
  -F "file=@test.mp3" \
  -F "durationSec=60"
```

2. **Check credits:**
```bash
curl http://localhost:3000/api/credits \
  -H "Authorization: Bearer <clerk_token>"
```

3. **Get jobs:**
```bash
curl http://localhost:3000/api/jobs \
  -H "Authorization: Bearer <clerk_token>"
```

### Automated Testing (TODO)
- Unit tests for credit system
- Integration tests for API endpoints
- Webhook signature verification tests

---

## Future Enhancements

- [ ] Batch transcription API
- [ ] Webhook delivery retries
- [ ] Usage analytics dashboard
- [ ] Custom vocabulary/terminology
- [ ] Multi-language support (Egyptian, Levantine)
- [ ] API keys for third-party integrations
