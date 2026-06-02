"use client";

import Link from "next/link";
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fileBaseName,
  formatDuration,
  msToSrtTs,
  safeDownloadName,
  segmentsToSrt,
  segmentsToTxt,
  type SrtSegment,
  type TranscribeJob,
} from "@/lib/transcribe";
import { getJob, updateJobSegments } from "@/lib/jobStorage";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Params = { id: string };
type SaveState = "saved" | "dirty" | "saving";

const AUTOSAVE_DEBOUNCE_MS = 500;

export default function EditorPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  const [job, setJob] = useState<TranscribeJob | null | undefined>(undefined);
  const [segments, setSegments] = useState<readonly SrtSegment[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load job from storage once on mount
  useEffect(() => {
    const stored = getJob(id);
    setJob(stored);
    if (stored) {
      setSegments(stored.segments);
      setLastSavedAt(Date.now());
    }
  }, [id]);

  // Debounced auto-save — only after user dirties the doc
  const scheduleSave = useCallback(
    (next: readonly SrtSegment[]) => {
      setSaveState("dirty");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaveState("saving");
        const updated = updateJobSegments(id, next);
        if (updated) {
          setJob(updated);
          setSaveState("saved");
          setLastSavedAt(Date.now());
        } else {
          setSaveState("dirty");
        }
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [id]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handleEditText = useCallback(
    (index: number, text: string) => {
      setSegments((prev) => {
        const next = prev.map((seg) =>
          seg.index === index ? { ...seg, text } : seg
        );
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-32 sm:px-10 sm:pt-36">
        <div className="w-full max-w-4xl">
          {job === undefined && <LoadingState />}
          {job === null && <NotFoundState />}
          {job && (
            <EditorView
              job={job}
              segments={segments}
              saveState={saveState}
              lastSavedAt={lastSavedAt}
              onEditText={handleEditText}
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// States
// ────────────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="rounded-3xl border border-line bg-surface/60 p-10 text-center backdrop-blur">
      <p className="font-mono text-xs text-mute">Loading editor…</p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="rounded-3xl border border-line bg-surface/60 p-10 text-center backdrop-blur">
      <p className="font-display text-2xl font-medium text-bone">
        Transcript not found.
      </p>
      <p className="mt-3 text-sm text-mute">
        We couldn&apos;t find this transcript on your device.
      </p>
      <Link
        href="/transcribe"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-signal px-6 py-3 text-sm font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
      >
        Transcribe a new file →
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Editor view
// ────────────────────────────────────────────────────────────────────────────

function EditorView({
  job,
  segments,
  saveState,
  lastSavedAt,
  onEditText,
}: {
  job: TranscribeJob;
  segments: readonly SrtSegment[];
  saveState: SaveState;
  lastSavedAt: number | null;
  onEditText: (index: number, text: string) => void;
}) {
  return (
    <>
      <EditorHeader
        job={job}
        segments={segments}
        saveState={saveState}
        lastSavedAt={lastSavedAt}
      />
      <SegmentList segments={segments} onEditText={onEditText} />
      <FooterNav jobId={job.id} />
    </>
  );
}

function EditorHeader({
  job,
  segments,
  saveState,
  lastSavedAt,
}: {
  job: TranscribeJob;
  segments: readonly SrtSegment[];
  saveState: SaveState;
  lastSavedAt: number | null;
}) {
  const base = useMemo(() => safeDownloadName(fileBaseName(job.filename)), [job.filename]);

  const download = (kind: "srt" | "txt") => {
    const content =
      kind === "srt" ? segmentsToSrt(segments) : segmentsToTxt(segments);
    const blob = new Blob([content], {
      type: kind === "srt" ? "application/x-subrip" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}.${kind}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-wider text-signal">
          Editor
        </p>
        <h1 className="mt-2 truncate font-display text-2xl font-medium tracking-tight text-bone sm:text-3xl">
          {job.filename}
        </h1>
        <p className="mt-1 font-mono text-xs text-mute">
          {formatDuration(job.durationSec)} · {segments.length} segments ·{" "}
          <SaveBadge state={saveState} lastSavedAt={lastSavedAt} />
        </p>
      </div>
      <div className="flex flex-shrink-0 gap-2">
        <button
          type="button"
          onClick={() => download("srt")}
          className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
        >
          Download .srt
        </button>
        <button
          type="button"
          onClick={() => download("txt")}
          className="rounded-full border border-line bg-ink px-4 py-2 text-sm font-medium text-bone hover:border-mute"
        >
          .txt
        </button>
      </div>
    </div>
  );
}

function SaveBadge({
  state,
  lastSavedAt,
}: {
  state: SaveState;
  lastSavedAt: number | null;
}) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (state !== "saved") return;
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(tick);
  }, [state]);

  if (state === "saving")
    return <span className="text-signal">Saving…</span>;
  if (state === "dirty")
    return <span className="text-mute">Unsaved changes</span>;
  if (state === "saved" && lastSavedAt) {
    const ago = Math.round((now - lastSavedAt) / 1000);
    if (ago < 5) return <span className="text-ok">Saved · just now</span>;
    if (ago < 60) return <span className="text-ok">Saved · {ago}s ago</span>;
    const mins = Math.round(ago / 60);
    return <span className="text-ok">Saved · {mins}m ago</span>;
  }
  return <span className="text-ok">Saved</span>;
}

function SegmentList({
  segments,
  onEditText,
}: {
  segments: readonly SrtSegment[];
  onEditText: (index: number, text: string) => void;
}) {
  return (
    <ol className="space-y-2 rounded-3xl border border-line bg-surface/60 p-2 backdrop-blur sm:p-3">
      {segments.map((seg) => (
        <SegmentRow key={seg.index} seg={seg} onEditText={onEditText} />
      ))}
    </ol>
  );
}

function SegmentRow({
  seg,
  onEditText,
}: {
  seg: SrtSegment;
  onEditText: (index: number, text: string) => void;
}) {
  return (
    <li className="grid grid-cols-1 gap-3 rounded-2xl bg-ink/40 p-4 transition-colors hover:bg-ink/60 sm:grid-cols-[120px_1fr] sm:gap-5">
      <div className="select-none">
        <div className="font-mono text-xs text-signal">#{seg.index}</div>
        <div className="mt-1 font-mono text-[11px] leading-snug text-mute">
          {msToSrtTs(seg.startMs)}
          <br />
          → {msToSrtTs(seg.endMs)}
        </div>
      </div>
      <TextField
        value={seg.text}
        onChange={(text) => onEditText(seg.index, text)}
        ariaLabel={`Segment ${seg.index} text`}
      />
    </li>
  );
}

function TextField({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (text: string) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow on mount and on every value change
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir="rtl"
      aria-label={ariaLabel}
      rows={1}
      spellCheck={false}
      className="w-full resize-none rounded-xl border border-transparent bg-transparent px-3 py-2 font-arabic text-base leading-relaxed text-bone outline-none transition-colors focus:border-signal/40 focus:bg-ink/50"
    />
  );
}

function FooterNav({ jobId }: { jobId: string }) {
  return (
    <div className="mt-8 flex flex-col items-start justify-between gap-3 text-sm text-mute sm:flex-row sm:items-center">
      <Link
        href={`/result/${jobId}`}
        className="link-metis text-bone"
      >
        ← Back to result
      </Link>
      <p className="text-xs">
        Changes auto-save on your device. Download to keep them forever.
      </p>
    </div>
  );
}
