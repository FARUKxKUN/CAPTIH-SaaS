"use client";

import Link from "next/link";
import {
  formatBytes,
  formatDuration,
  type TranscribeJob,
} from "@/lib/transcribe";

/**
 * Compact card variant of a transcription job — replaces the table row layout
 * with a richer, scannable "project card" feel like in modern SaaS dashboards.
 */
export function TranscriptCard({
  job,
  onDelete,
}: {
  job: TranscribeJob;
  onDelete: (id: string) => void;
}) {
  const created = new Date(job.createdAt);
  const dateLabel = created.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  // First Arabic line for a preview snippet
  const previewText =
    job.segments[0]?.text?.slice(0, 60) ?? "No transcript yet";

  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-surface/40 p-5 backdrop-blur transition-all duration-300 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-mute">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-signal/15">
          <FileIcon className="h-5 w-5 text-signal" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-medium text-bone">
            {job.filename}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-mute">
            {formatDuration(job.durationSec)} · {formatBytes(job.sizeBytes)} ·{" "}
            {dateLabel}
          </p>
        </div>
        <StatusDot status={job.status} />
      </div>

      <div className="mt-4 rounded-xl border border-line/60 bg-ink/40 p-3">
        <p
          className="line-clamp-2 font-arabic text-[13px] leading-relaxed text-mute"
          dir="rtl"
        >
          {previewText}…
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-mute">
          {job.segments.length} segment{job.segments.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-1.5">
          <Link
            href={`/editor/${job.id}`}
            className="rounded-full border border-line bg-ink px-3 py-1 text-[11px] font-medium text-bone hover:border-mute"
          >
            Edit
          </Link>
          <Link
            href={`/result/${job.id}`}
            className="rounded-full bg-signal px-3 py-1 text-[11px] font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
          >
            Open
          </Link>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(`Delete "${job.filename}"? This cannot be undone.`)
              ) {
                onDelete(job.id);
              }
            }}
            className="rounded-full border border-line bg-ink px-2 py-1 text-[11px] text-mute hover:border-signal hover:text-signal"
            aria-label={`Delete ${job.filename}`}
          >
            ✕
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusDot({ status }: { status: TranscribeJob["status"] }) {
  const color =
    status === "done"
      ? "bg-ok"
      : status === "failed"
        ? "bg-mute"
        : "bg-signal animate-pulse";
  return (
    <span
      className={`mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${color}`}
      aria-label={`Status: ${status}`}
    />
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
