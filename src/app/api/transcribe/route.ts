import { NextResponse } from "next/server";
import {
  type TranscribeJob,
  type SrtSegment,
  ACCEPTED_MIME,
  MAX_FILE_BYTES,
  sniffMediaContainer,
} from "@/lib/transcribe";

/**
 * STUB endpoint — accepts audio/video file, returns a realistic darija SRT.
 * Simulates Modal cold-start (~30s) but capped for dev.
 *
 * Swap to Modal when FARUKxAUTO is deployed:
 *   1. Replace mockSegments() with `await fetch(MODAL_ENDPOINT, { body: file })`
 *   2. Map Modal's whisper-large-v3 response to SrtSegment[]
 *   3. NEVER trust client-supplied durationSec for billing — probe with ffprobe
 *      on the server (Vercel function or Modal worker) before metering.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

// Mock segments — realistic Tunisian darija from a typical podcast intro
const MOCK_DARIJA_LINES = [
  "أهلا بيكم في الحلقة الجديدة متاع البودكاست،",
  "اليوم باش نحكيو على موضوع يهم كل واحد فينا.",
  "كي تبدا تخمم في حياتك، الأمور تبان مختلفة.",
  "هذا الشي اللي نحب نقاسمو معاكم اليوم،",
  "وباش نسمعو رأيكم في الموضوع.",
  "نتمناو الحلقة تعجبكم، خلّيوا تعليقاتكم،",
  "وما تنسوش تشاركوها مع أصحابكم.",
  "يلا، نبداو على طول.",
];

function mockSegments(durationSec: number): SrtSegment[] {
  const lineCount = Math.min(
    MOCK_DARIJA_LINES.length,
    Math.max(2, Math.ceil(durationSec / 4))
  );
  const segDurationMs = Math.floor((durationSec * 1000) / lineCount);
  return Array.from({ length: lineCount }, (_, i) => ({
    index: i + 1,
    startMs: i * segDurationMs,
    endMs: (i + 1) * segDurationMs,
    text: MOCK_DARIJA_LINES[i % MOCK_DARIJA_LINES.length],
  }));
}

function buildJob(opts: {
  filename: string;
  sizeBytes: number;
  durationSec: number;
}): TranscribeJob {
  const segments = mockSegments(opts.durationSec);
  const transcript = segments.map((s) => s.text).join("\n");
  return {
    id: crypto.randomUUID(),
    filename: opts.filename,
    sizeBytes: opts.sizeBytes,
    durationSec: opts.durationSec,
    createdAt: new Date().toISOString(),
    status: "done",
    segments,
    transcript,
    language: "ar-TN",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Defensive guards
// ────────────────────────────────────────────────────────────────────────────

/**
 * In-memory token bucket per IP. Survives within a single serverless instance.
 * For production, swap to Upstash Redis / Vercel KV — serverless cold starts
 * make in-memory limits leaky across instances.
 */
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

    // Client-declared duration is advisory only. When Modal lands, run ffprobe
    // server-side and bill from THAT value, never this one.
    const declaredDuration = Number(formData.get("durationSec"));
    const durationSec =
      Number.isFinite(declaredDuration) && declaredDuration > 0
        ? Math.min(declaredDuration, 30 * 60)
        : 30;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const job = buildJob({
      filename: file.name,
      sizeBytes: file.size,
      durationSec,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error("/api/transcribe error", error);
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 }
    );
  }
}
