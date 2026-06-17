"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCEPTED_EXT,
  formatBytes,
  formatDuration,
  isAcceptedFile,
  MAX_DURATION_SEC,
  MAX_FILE_BYTES,
  type TranscribeJob,
} from "@/lib/transcribe";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { track } from "@/lib/analytics";

type UploadState =
  | { kind: "idle" }
  | { kind: "selected"; file: File; durationSec: number }
  | { kind: "uploading"; file: File; durationSec: number; pct: number }
  | { kind: "processing"; file: File; durationSec: number; pct: number }
  | { kind: "error"; message: string };

const ACCEPT_ATTR = ACCEPTED_EXT.join(",");

export default function TranscribePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => setState({ kind: "idle" });

  const handleFile = useCallback(async (file: File) => {
    if (!isAcceptedFile(file)) {
      setState({
        kind: "error",
        message: `Unsupported file. We accept ${ACCEPTED_EXT.join(", ")} up to ${
          MAX_FILE_BYTES / 1_048_576
        } MB.`,
      });
      return;
    }

    // Read duration via media element
    const durationSec = await readMediaDuration(file).catch(() => 0);
    if (durationSec > MAX_DURATION_SEC) {
      setState({
        kind: "error",
        message: `File is ${formatDuration(durationSec)} — max is ${formatDuration(
          MAX_DURATION_SEC
        )} for v1.`,
      });
      return;
    }

    setState({ kind: "selected", file, durationSec });
  }, []);

  const startTranscription = useCallback(async () => {
    if (state.kind !== "selected") return;
    const { file, durationSec } = state;

    setState({ kind: "uploading", file, durationSec, pct: 0 });
    track("transcribe_started", {
      duration_sec: Math.round(durationSec),
      file_type: file.type || "unknown",
      size_bytes: file.size,
    });

    try {
      const job = await uploadWithProgress({
        file,
        durationSec,
        onUploadProgress: (pct) =>
          setState({ kind: "uploading", file, durationSec, pct }),
        onUploadComplete: () =>
          setState({ kind: "processing", file, durationSec, pct: 0 }),
        onProcessingProgress: (pct) =>
          setState({ kind: "processing", file, durationSec, pct }),
      });

      track("transcribe_completed", {
        job_id: job.id,
        duration_sec: Math.round(durationSec),
        segments: job.segments.length,
      });
      // Job is already persisted to Supabase by /api/transcribe.
      router.push(`/result/${job.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      // Distinguish out-of-credits from generic failures for the funnel.
      if (/out of minutes|insufficient/i.test(message)) {
        track("out_of_credits", { duration_sec: Math.round(durationSec) });
      } else {
        track("transcribe_failed", { reason: message });
      }
      setState({ kind: "error", message });
    }
  }, [state, router]);

  // Drag-drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-32 sm:px-10 sm:pt-40">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-signal">
              Captih it.
            </p>
            <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
              Drop your file.
            </h1>
            <p className="mt-3 text-base text-mute sm:text-lg">
              Up to 30 min · MP4, MOV, MP3, WAV, M4A, WebM · Tunisian darija only.
            </p>
          </div>

          {state.kind === "idle" && (
            <DropZone
              isDragging={isDragging}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            />
          )}

          {state.kind === "selected" && (
            <SelectedCard
              file={state.file}
              durationSec={state.durationSec}
              onCancel={reset}
              onStart={startTranscription}
            />
          )}

          {(state.kind === "uploading" || state.kind === "processing") && (
            <ProgressCard
              file={state.file}
              durationSec={state.durationSec}
              phase={state.kind}
              pct={state.pct}
            />
          )}

          {state.kind === "error" && (
            <ErrorCard message={state.message} onRetry={reset} />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={onPick}
            className="sr-only"
            aria-hidden
          />

          {(state.kind === "idle" || state.kind === "selected") && (
            <p className="mt-8 text-center text-xs text-mute">
              First 3 minutes free — no card required. Audio deleted after processing.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function DropZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative flex w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed bg-surface/40 px-6 py-20 text-center transition-all duration-200 ease-[var(--ease-spring)] hover:border-signal hover:bg-surface/60 ${
        isDragging
          ? "border-signal bg-signal/10 scale-[1.02]"
          : "border-line"
      }`}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-signal/20 blur-2xl group-hover:bg-signal/40" />
        <svg
          viewBox="0 0 24 24"
          className="relative h-14 w-14 text-signal sm:h-16 sm:w-16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
          <path d="M5 21h14" />
        </svg>
      </div>
      <div>
        <p className="font-display text-lg font-medium text-bone sm:text-xl">
          Drop your video or audio here
        </p>
        <p className="mt-1 font-mono text-xs text-mute">
          or tap to pick from your device
        </p>
      </div>
    </button>
  );
}

function SelectedCard({
  file,
  durationSec,
  onCancel,
  onStart,
}: {
  file: File;
  durationSec: number;
  onCancel: () => void;
  onStart: () => void;
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface/60 p-6 backdrop-blur sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-signal/15">
          <FileIcon className="h-6 w-6 text-signal" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-medium text-bone sm:text-lg">
            {file.name}
          </p>
          <p className="mt-1 font-mono text-xs text-mute">
            {formatBytes(file.size)} · {formatDuration(durationSec)}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-mute hover:text-bone"
          aria-label="Choose a different file"
        >
          Change
        </button>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-6 block w-full rounded-full bg-signal px-6 py-4 text-base font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
      >
        Captiiiih it →
      </button>
    </div>
  );
}

function ProgressCard({
  file,
  durationSec,
  phase,
  pct,
}: {
  file: File;
  durationSec: number;
  phase: "uploading" | "processing";
  pct: number;
}) {
  const label = phase === "uploading" ? "Uploading" : "Listening";
  return (
    <div className="rounded-3xl border border-line bg-surface/60 p-6 backdrop-blur sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-signal/15">
          <FileIcon className="h-6 w-6 text-signal" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-medium text-bone sm:text-lg">
            {file.name}
          </p>
          <p className="mt-1 font-mono text-xs text-mute">
            {formatBytes(file.size)} · {formatDuration(durationSec)}
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-signal/15 px-2.5 py-1 text-[10px] font-medium text-signal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
          {label.toUpperCase()}
        </span>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between font-mono text-xs">
          <span className="text-mute">{label}…</span>
          <span className="text-bone">
            {phase === "processing" && pct === 0 ? "" : `${Math.round(pct)}%`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-signal transition-all duration-300 ease-[var(--ease-spring)]"
            style={{
              width:
                phase === "processing" && pct === 0
                  ? "100%"
                  : `${Math.max(2, pct)}%`,
              animation:
                phase === "processing" && pct === 0
                  ? "pulse 1.5s ease-in-out infinite"
                  : undefined,
            }}
          />
        </div>
      </div>

      <p className="mt-6 text-xs text-mute">
        {phase === "uploading"
          ? "Sending your file. Don't close this tab."
          : "CAPTIH is listening… ~3 minutes per audio hour."}
      </p>
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  // Auth errors ("Sign in to transcribe") need a real way in, not a retry.
  const authRequired = /sign\s?-?in|log\s?in|unauthor|not authenticated|not signed in/i.test(
    message
  );
  return (
    <div className="rounded-3xl border border-line bg-surface/60 p-8 text-center backdrop-blur">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal/15">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-signal"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 9v3.75M12 16.5h.008v.008H12v-.008zM12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      </div>
      <p className="font-display text-lg font-medium text-bone">
        {authRequired ? "Sign in to Captih it." : "Hmm."}
      </p>
      <p className="mt-2 text-sm text-mute">
        {authRequired
          ? "Create a free account to transcribe - your first 3 minutes are on us."
          : message}
      </p>

      {authRequired ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-up?redirect_url=/transcribe"
            className="inline-flex w-full items-center justify-center rounded-full bg-signal px-6 py-3 text-sm font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5 sm:w-auto"
          >
            Sign up free →
          </Link>
          <Link
            href="/sign-in?redirect_url=/transcribe"
            className="inline-flex w-full items-center justify-center rounded-full border border-line bg-ink px-6 py-3 text-sm font-medium text-bone hover:border-mute sm:w-auto"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-line bg-ink px-6 py-3 text-sm font-medium text-bone hover:border-mute"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function FileIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 3v5a1 1 0 001 1h5" />
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h9l7 7v9a2 2 0 01-2 2z" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Upload helpers
// ────────────────────────────────────────────────────────────────────────────

function readMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith("video/");
    const el = isVideo
      ? document.createElement("video")
      : document.createElement("audio");
    el.preload = "metadata";
    el.muted = true;
    const url = URL.createObjectURL(file);
    el.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    el.onloadedmetadata = () => {
      const d = el.duration;
      cleanup();
      resolve(Number.isFinite(d) ? d : 0);
    };
    el.onerror = () => {
      cleanup();
      reject(new Error("Could not read media duration"));
    };
  });
}

function uploadWithProgress({
  file,
  durationSec,
  onUploadProgress,
  onUploadComplete,
  onProcessingProgress,
}: {
  file: File;
  durationSec: number;
  onUploadProgress: (pct: number) => void;
  onUploadComplete: () => void;
  onProcessingProgress: (pct: number) => void;
}): Promise<TranscribeJob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("durationSec", String(durationSec));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onUploadProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.upload.onload = () => {
      onUploadComplete();
      // Smooth fake progress while server processes (real progress would come from SSE/polling)
      let p = 0;
      const timer = setInterval(() => {
        p = Math.min(90, p + 5 + Math.random() * 10);
        onProcessingProgress(p);
      }, 350);
      xhr.addEventListener("loadend", () => clearInterval(timer), { once: true });
    };

    xhr.onload = () => {
      try {
        if (xhr.status < 200 || xhr.status >= 300) {
          const errMsg = safeParseError(xhr.responseText) ?? `HTTP ${xhr.status}`;
          reject(new Error(errMsg));
          return;
        }
        const payload = JSON.parse(xhr.responseText) as { job?: TranscribeJob };
        if (!payload.job) {
          reject(new Error("Server returned no job"));
          return;
        }
        resolve(payload.job);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Bad server response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    xhr.open("POST", "/api/transcribe");
    xhr.send(formData);
  });
}

function safeParseError(text: string): string | null {
  try {
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error ?? null;
  } catch {
    return null;
  }
}
