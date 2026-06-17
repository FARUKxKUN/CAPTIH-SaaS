import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";
import { createTranscriptionJob, updateJobProgress } from "@/lib/job-system";
import { cleanupSegments } from "@/lib/gemini-cleanup";
import {
  groupWordsIntoCaptions,
  DEFAULT_CAPTION_SETTINGS,
} from "@/lib/caption-format";
import {
  getUserActiveMinutes,
  deductUserMinutes,
  createTransaction,
  refundUserMinutes,
} from "@/lib/credit-system";
import {
  type TranscribeJob,
  type SrtSegment,
  ACCEPTED_MIME,
  MAX_FILE_BYTES,
  sniffMediaContainer,
  segmentsToTxt,
} from "@/lib/transcribe";

/**
 * Transcribe endpoint — Supabase-backed.
 *
 * Flow: auth (cookie) → validate file → credit check → create job →
 * deduct credits → transcribe (STUB) → persist result → return job.
 * On failure, minutes are refunded automatically.
 *
 * Returns the `TranscribeJob` shape the frontend (src/app/transcribe/page.tsx)
 * already consumes — do NOT change the response shape without updating it.
 *
 * Swap to Modal: replace mockSegments() with a call to MODAL_TRANSCRIBE_URL
 * and map whisper-large-v3 output to SrtSegment[]. Probe duration server-side
 * (ffprobe) before metering — never trust client durationSec for billing.
 */

export const runtime = "nodejs";
// FARUKxAUTO on A10G runs ~5x realtime; a 30-min file can take minutes.
// Allow up to 5 min before the route times out.
export const maxDuration = 300;

type ModalSegment = { start: number; end: number; text: string };

/**
 * Call the FARUKxAUTO Modal endpoint and map its timestamped segments
 * (seconds) into the app's SrtSegment[] shape (milliseconds).
 * Throws on any non-200 so the caller can refund + surface an error.
 */
async function transcribeViaModal(file: File): Promise<SrtSegment[]> {
  const url = process.env.MODAL_TRANSCRIBE_URL;
  const key = process.env.MODAL_TRANSCRIBE_TOKEN;
  if (!url || !key) {
    throw new Error("Modal transcription endpoint not configured");
  }

  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch(url, {
    method: "POST",
    headers: { "X-API-Key": key },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Modal returned ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { segments?: ModalSegment[] };
  const segments = data.segments ?? [];

  return segments.map((seg, i) => ({
    index: i + 1,
    startMs: Math.round(seg.start * 1000),
    endMs: Math.round(seg.end * 1000),
    text: seg.text.trim(),
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// Defensive guards
// ────────────────────────────────────────────────────────────────────────────

const WINDOW_MS = 60_000;
const MAX_REQ_PER_WINDOW = 5;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const slot = ipHits.get(ip);
  if (!slot || slot.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  if (slot.count >= MAX_REQ_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((slot.resetAt - now) / 1000) };
  }
  slot.count += 1;
  return { ok: true, retryAfter: 0 };
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    const o = new URL(origin);
    return o.host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  let jobId: string | null = null;
  let userId: string | null = null;
  let minutesCharged = 0;

  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const rl = rateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    // Auth via Clerk (getAuthUser → Clerk auth()).
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to transcribe." },
        { status: 401 }
      );
    }
    userId = user.id;

    // Reject oversize bodies before buffering the whole upload.
    const contentLength = Number(request.headers.get("content-length") ?? "");
    if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_BYTES / 1_048_576} MB)` },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_BYTES / 1_048_576} MB)` },
        { status: 413 }
      );
    }

    const declaredMime = file.type;
    const mimeOk =
      declaredMime === "" ||
      ACCEPTED_MIME.includes(declaredMime as (typeof ACCEPTED_MIME)[number]);
    if (!mimeOk) {
      return NextResponse.json(
        { error: "Unsupported media type" },
        { status: 415 }
      );
    }

    // Magic-byte verification — declared MIME alone is forgeable.
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!sniffMediaContainer(head)) {
      return NextResponse.json(
        { error: "File does not look like a supported audio/video container." },
        { status: 415 }
      );
    }

    // Client-declared duration is advisory. When Modal lands, probe with
    // ffprobe server-side and bill from THAT value, never this one.
    const declaredDuration = Number(formData.get("durationSec"));
    // duration_seconds is a bigint column — round to a whole number.
    const durationSec =
      Number.isFinite(declaredDuration) && declaredDuration > 0
        ? Math.min(Math.round(declaredDuration), 30 * 60)
        : 30;

    minutesCharged = Math.ceil(durationSec / 60);

    // Credit check before doing any work.
    const activeMinutes = await getUserActiveMinutes(userId);
    if (activeMinutes < minutesCharged) {
      return NextResponse.json(
        { error: "Out of minutes. Top up to continue." },
        { status: 402 }
      );
    }

    // Create the job record.
    const job = await createTranscriptionJob({
      userId,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type || "unknown",
      uploadPath: `uploads/${userId}/${crypto.randomUUID()}/${file.name}`,
    });
    const id = job.id as string;
    jobId = id;

    await updateJobProgress(id, {
      status: "processing",
      processingStartedAt: new Date().toISOString(),
      durationSeconds: durationSec,
    });

    // Deduct credits (race-safe: another request may have spent them).
    const deducted = await deductUserMinutes(userId, minutesCharged);
    if (!deducted) {
      await updateJobProgress(id, {
        status: "failed",
        errorMessage: "Insufficient credits at processing time",
      });
      return NextResponse.json(
        { error: "Out of minutes. Top up to continue." },
        { status: 402 }
      );
    }

    await createTransaction(userId, "credit_deduction", -minutesCharged, id, {
      filename: file.name,
      duration_sec: durationSec,
    });

    // ── Transcription (real — FARUKxAUTO via Modal, word-level) ──────────────
    // Modal returns one item per word with real timestamps.
    const words = await transcribeViaModal(file);

    // Empty output = model heard nothing usable. Per spec: refund + tell user.
    if (words.length === 0) {
      await refundUserMinutes(
        userId,
        id,
        minutesCharged,
        "Empty transcription — automatic refund"
      );
      await updateJobProgress(id, {
        status: "failed",
        errorMessage: "We couldn't hear anything in your file.",
      });
      return NextResponse.json(
        {
          error:
            "We couldn't hear anything in your file. Minutes refunded. Try a clearer recording?",
        },
        { status: 422 }
      );
    }

    // Billing integrity: the client-declared durationSec is advisory and
    // forgeable (a 30-min file can claim 1s). Reconcile against the REAL
    // transcribed length (last word timestamp) and collect any shortfall so
    // under-reporting can't buy a long transcription for a short charge.
    const actualSec = words.reduce((max, w) => Math.max(max, w.endMs), 0) / 1000;
    const actualMinutes = Math.min(Math.ceil(actualSec / 60), 30);
    if (actualMinutes > minutesCharged) {
      const extra = actualMinutes - minutesCharged;
      const collected = await deductUserMinutes(userId, extra);
      if (collected) {
        await createTransaction(userId, "credit_deduction", -extra, id, {
          reason: "duration_reconciliation",
          client_sec: durationSec,
          actual_sec: Math.round(actualSec),
        });
        minutesCharged = actualMinutes;
      } else {
        // Couldn't collect the difference (insufficient balance). Deliver this
        // one (already transcribed) but log the shortfall for follow-up.
        console.warn(
          `[transcribe] under-collected ${extra}m on job ${id}: client ${durationSec}s vs actual ${Math.round(actualSec)}s`
        );
      }
    }

    // Clean the WORDS with Gemini (always on). Gemini sees the full ordered
    // word list as context and returns corrected words 1:1, preserving each
    // word's timestamp. All export chunking then re-groups these CLEANED words
    // locally — no further Gemini calls needed, and every format stays clean.
    const cleanedWords = await cleanupSegments(words);

    // Default captions for the on-page preview, grouped from cleaned words.
    const segments = groupWordsIntoCaptions(
      cleanedWords,
      DEFAULT_CAPTION_SETTINGS
    );
    const transcript = segmentsToTxt(segments);
    // ────────────────────────────────────────────────────────────────────────

    await updateJobProgress(id, {
      status: "completed",
      processingCompletedAt: new Date().toISOString(),
      transcriptText: transcript,
      // Store cleaned words so export can re-chunk any way with clean text.
      transcriptJson: { words: cleanedWords, captions: segments },
      minutesCharged,
    });

    const result: TranscribeJob = {
      id,
      filename: file.name,
      sizeBytes: file.size,
      durationSec,
      createdAt: new Date().toISOString(),
      status: "done",
      segments,
      words: cleanedWords,
      transcript,
      language: "ar-TN",
    };

    return NextResponse.json({ job: result });
  } catch (error) {
    console.error("/api/transcribe error", error);

    // Refund minutes if we already deducted them for a job that then failed.
    if (jobId && userId && minutesCharged > 0) {
      try {
        await refundUserMinutes(
          userId,
          jobId,
          minutesCharged,
          "Transcription failed — automatic refund"
        );
      } catch (refundErr) {
        console.error("Refund failed for job", jobId, refundErr);
      }
    }

    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 }
    );
  }
}
