"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  formatBytes,
  formatDuration,
  msToSrtTs,
  fileBaseName,
  safeDownloadName,
  segmentsToSrt,
  segmentsToVtt,
  segmentsToTxt,
  type SrtSegment,
  type TranscribeJob,
  type TxtStyle,
} from "@/lib/transcribe";
import {
  groupWordsIntoCaptions,
  DEFAULT_CAPTION_SETTINGS,
  CAPTION_LIMITS,
  type CaptionSettings,
} from "@/lib/caption-format";
import { getJob } from "@/lib/jobStorage";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignUpToDownloadModal } from "@/components/SignUpToDownloadModal";

type Params = { id: string };
type DownloadKind = "srt" | "txt";
type ExportFormat = "srt" | "vtt" | "txt";

export default function ResultPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  const [job, setJob] = useState<TranscribeJob | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getJob(id).then((j) => {
      if (!cancelled) setJob(j);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-32 sm:px-10 sm:pt-40">
        <div className="w-full max-w-4xl">
          {job === undefined && <LoadingState />}
          {job === null && <NotFoundState />}
          {job && <ResultView job={job} />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-3xl border border-line bg-surface/60 p-10 text-center backdrop-blur">
      <p className="font-mono text-xs text-mute">Loading transcript…</p>
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
        We couldn&apos;t find this transcript on your device. It may have been
        cleared from your browser storage, or this link was opened on a
        different device.
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

function ResultView({ job }: { job: TranscribeJob }) {
  // Preview shows the default cleaned captions. Final formatting (caption
  // sizing, format, cleanup) is chosen in the export popup on download.
  const previewSegments = job.segments.slice(0, 30);
  const remaining = job.segments.length - previewSegments.length;

  return (
    <>
      <Header job={job} segmentCount={job.segments.length} />
      <Downloads job={job} />
      <Preview previewSegments={previewSegments} remaining={remaining} />
      <FooterCta jobId={job.id} />
    </>
  );
}

function Header({
  job,
  segmentCount,
}: {
  job: TranscribeJob;
  segmentCount: number;
}) {
  return (
    <div className="mb-8">
      <p className="font-mono text-xs uppercase tracking-wider text-ok">
        Done — Tunisian dialect captured.
      </p>
      <h1 className="mt-3 truncate font-display text-3xl font-medium tracking-tight text-bone sm:text-4xl">
        {job.filename}
      </h1>
      <p className="mt-2 font-mono text-xs text-mute">
        {formatDuration(job.durationSec)} · {formatBytes(job.sizeBytes)} ·{" "}
        {segmentCount} captions
      </p>
    </div>
  );
}

function Downloads({
  job,
}: {
  job: TranscribeJob;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const base = safeDownloadName(fileBaseName(job.filename));
  const autoDownloadFired = useRef(false);

  const hasWords = !!job.words && job.words.length > 0;

  // Sign-up gate modal state
  const [modalFormat, setModalFormat] = useState<DownloadKind | null>(null);
  // Export-options popup state: which trigger opened it (srt | txt), or null.
  const [exportFor, setExportFor] = useState<DownloadKind | null>(null);

  // Real auth check — no dev bypass here. Modal handles the dev case.
  const canDownload = isLoaded && isSignedIn;

  // Build + download a file. Cleanup is always applied (stored words are
  // already Gemini-cleaned), so we just re-chunk them per the export settings.
  const exportFile = useCallback(
    (opts: {
      format: ExportFormat;
      txtStyle: TxtStyle;
      sizing: CaptionSettings;
    }) => {
      // Re-chunk cleaned words at the chosen settings; fall back to stored
      // captions for older jobs without word data.
      const source: SrtSegment[] = hasWords
        ? groupWordsIntoCaptions(job.words!, opts.sizing)
        : [...job.segments];

      let content: string;
      let ext: string;
      let mime: string;
      if (opts.format === "srt") {
        content = segmentsToSrt(source);
        ext = "srt";
        mime = "application/x-subrip;charset=utf-8";
      } else if (opts.format === "vtt") {
        content = segmentsToVtt(source);
        ext = "vtt";
        mime = "text/vtt;charset=utf-8";
      } else {
        content = segmentsToTxt(source, opts.txtStyle);
        ext = "txt";
        mime = "text/plain;charset=utf-8";
      }

      // UTF-8 BOM so Windows editors / CapCut render Arabic correctly.
      const BOM = "﻿";
      const blob = new Blob([BOM + content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [base, job.segments, job.words, hasWords]
  );

  // Resume after sign-up: ?download=srt|txt → quick default download → dashboard
  useEffect(() => {
    if (autoDownloadFired.current) return;
    if (!canDownload) return;
    const fmt = searchParams.get("download");
    if (fmt !== "srt" && fmt !== "txt") return;

    autoDownloadFired.current = true;

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("download");
    window.history.replaceState({}, "", cleanUrl.toString());

    const timer = setTimeout(() => {
      exportFile({
        format: fmt,
        txtStyle: "lines",
        sizing: DEFAULT_CAPTION_SETTINGS,
      });
      setTimeout(() => router.push("/dashboard?welcome=true"), 1200);
    }, 300);

    return () => clearTimeout(timer);
  }, [canDownload, searchParams, router, exportFile]);

  const handleDownload = (kind: DownloadKind) => {
    if (!canDownload) {
      // Not signed in → show the sign-up gate.
      setModalFormat(kind);
      return;
    }
    // Signed in → open the export-options popup.
    setExportFor(kind);
  };


  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <DownloadButton
          ext="srt"
          label="Download .srt"
          sub={canDownload ? "Drop into CapCut / InShot" : "Sign up to download"}
          locked={!canDownload}
          onClick={() => handleDownload("srt")}
        />
        <DownloadButton
          ext="txt"
          label="Download .txt"
          sub={canDownload ? "Plain transcript" : "Sign up to download"}
          locked={!canDownload}
          onClick={() => handleDownload("txt")}
        />
        <Link
          href={`/editor/${job.id}`}
          className="group flex items-center justify-between rounded-2xl border border-line bg-surface/40 px-5 py-4 transition-all duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-mute"
        >
          <div>
            <p className="font-display text-sm font-medium text-bone">
              Open in editor
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-mute">
              Fix typos before download
            </p>
          </div>
          <span
            className="font-mono text-lg text-mute transition-colors group-hover:text-bone"
            aria-hidden
          >
            →
          </span>
        </Link>
      </div>

      <SignUpToDownloadModal
        open={modalFormat !== null}
        format={modalFormat ?? "srt"}
        redirectUrl={`/result/${job.id}?download=${modalFormat ?? "srt"}`}
        onClose={() => setModalFormat(null)}
      />

      {exportFor && (
        <ExportModal
          initialFormat={exportFor}
          hasSizing={hasWords}
          previewWords={job.words ?? null}
          onClose={() => setExportFor(null)}
          onExport={(opts) => {
            exportFile(opts);
            setExportFor(null);
          }}
        />
      )}
    </>
  );
}

function ExportModal({
  initialFormat,
  hasSizing,
  previewWords,
  onClose,
  onExport,
}: {
  initialFormat: ExportFormat;
  hasSizing: boolean;
  previewWords: readonly SrtSegment[] | null;
  onClose: () => void;
  onExport: (opts: {
    format: ExportFormat;
    txtStyle: TxtStyle;
    sizing: CaptionSettings;
  }) => void;
}) {
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [txtStyle, setTxtStyle] = useState<TxtStyle>("lines");
  const [sizing, setSizing] = useState<CaptionSettings>(
    DEFAULT_CAPTION_SETTINGS
  );
  // Bumped by "Reorganize" to recompute the live caption count.
  const [reorgKey, setReorgKey] = useState(0);

  const setSize = <K extends keyof CaptionSettings>(
    key: K,
    value: CaptionSettings[K]
  ) => setSizing((s) => ({ ...s, [key]: value }));

  // Chunking only applies to subtitle formats and needs word data.
  const showChunking = hasSizing && format !== "txt";

  // Live caption count from current chunking (drives the Reorganize feedback).
  const captionCount = useMemo(() => {
    if (!showChunking || !previewWords) return null;
    return groupWordsIntoCaptions(previewWords, sizing).length;
    // reorgKey forces recompute even if sizing object identity is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewWords, sizing, showChunking, reorgKey]);

  const formats: { id: ExportFormat; label: string }[] = [
    { id: "srt", label: "SRT" },
    { id: "vtt", label: "VTT" },
    { id: "txt", label: "TXT" },
  ];

  const txtStyles: { id: TxtStyle; label: string }[] = [
    { id: "lines", label: "One line per caption" },
    { id: "paragraph", label: "Flowing paragraph" },
    { id: "timestamped", label: "With timestamps" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Export format */}
        <p className="font-mono text-xs uppercase tracking-wider text-mute">
          Export format
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {formats.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={`rounded-xl border px-3 py-3 font-mono text-sm font-medium transition-colors ${
                format === f.id
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-line text-bone hover:border-mute"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* TXT style */}
        {format === "txt" && (
          <div className="mt-5">
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-mute">
              Text style
            </p>
            <div className="flex flex-col gap-2">
              {txtStyles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTxtStyle(s.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    txtStyle === s.id
                      ? "border-signal bg-signal/10 text-signal"
                      : "border-line text-mute hover:border-mute"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chunking — subtitle formats only */}
        {showChunking && (
          <>
            <div className="mt-6 border-t border-line pt-5">
              <p className="font-mono text-xs uppercase tracking-wider text-mute">
                Chunking for export
              </p>

              {/* By Words / By Characters */}
              <div className="mt-3 flex rounded-xl border border-line p-1">
                {(
                  [
                    { id: "words", label: "By Words" },
                    { id: "characters", label: "By Characters" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSize("mode", m.id)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      sizing.mode === m.id
                        ? "bg-signal/10 text-signal"
                        : "text-mute hover:text-bone"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Slider for the active mode */}
              {sizing.mode === "words" ? (
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm text-bone">Words per chunk</label>
                    <span className="font-mono text-sm text-signal">
                      {sizing.wordsPerChunk}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={CAPTION_LIMITS.wordsPerChunk.min}
                    max={CAPTION_LIMITS.wordsPerChunk.max}
                    step={CAPTION_LIMITS.wordsPerChunk.step}
                    value={sizing.wordsPerChunk}
                    onChange={(e) =>
                      setSize("wordsPerChunk", Number(e.target.value))
                    }
                    className="w-full accent-signal"
                  />
                  <p className="mt-1 text-[11px] text-mute">
                    Tip: set to <span className="text-bone">1 word</span> for
                    word-level chunks.
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm text-bone">
                      Characters per chunk
                    </label>
                    <span className="font-mono text-sm text-signal">
                      {sizing.maxChars}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={CAPTION_LIMITS.maxChars.min}
                    max={CAPTION_LIMITS.maxChars.max}
                    step={CAPTION_LIMITS.maxChars.step}
                    value={sizing.maxChars}
                    onChange={(e) => setSize("maxChars", Number(e.target.value))}
                    className="w-full accent-signal"
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="mt-4 space-y-2">
                <ToggleRow
                  label="Uppercase everything"
                  checked={sizing.uppercase}
                  onChange={(v) => setSize("uppercase", v)}
                />
                <ToggleRow
                  label="Punctuation-aware chunks"
                  checked={sizing.punctuationAware}
                  onChange={(v) => setSize("punctuationAware", v)}
                />
              </div>

              {/* Reorganize */}
              <button
                type="button"
                onClick={() => setReorgKey((k) => k + 1)}
                className="mt-4 w-full rounded-full border border-line bg-ink px-5 py-3 text-sm font-medium text-bone transition-colors hover:border-mute"
              >
                Reorganize
                {captionCount !== null && (
                  <span className="ml-2 font-mono text-xs text-mute">
                    {captionCount} captions
                  </span>
                )}
              </button>
            </div>
          </>
        )}

        {/* Download */}
        <button
          type="button"
          onClick={() => onExport({ format, txtStyle, sizing })}
          className="mt-4 w-full rounded-full bg-signal px-5 py-3 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5"
        >
          Download {format.toUpperCase()}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-full px-5 py-2 text-sm text-mute transition-colors hover:text-bone"
        >
          Cancel
        </button>

        {showChunking && (
          <p className="mt-3 text-center text-[11px] text-mute">
            SRT &amp; VTT export using the chunking above. Adjust to export
            exactly what you need.
          </p>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-bone">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-signal" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function DownloadButton({
  ext,
  label,
  sub,
  locked,
  onClick,
}: {
  ext: string;
  label: string;
  sub: string;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl bg-signal px-5 py-4 text-ink transition-all duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:bg-signal/90"
    >
      <div className="flex items-center gap-2 text-left">
        {locked && (
          <LockIcon className="h-4 w-4 text-ink/80" aria-hidden />
        )}
        <div>
          <p className="font-display text-sm font-medium">{label}</p>
          <p className="mt-0.5 font-mono text-[11px] opacity-70">{sub}</p>
        </div>
      </div>
      <span className="rounded-md bg-ink/15 px-2 py-0.5 font-mono text-[10px] uppercase">
        {ext}
      </span>
    </button>
  );
}

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function Preview({
  previewSegments,
  remaining,
}: {
  previewSegments: TranscribeJob["segments"];
  remaining: number;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface/70 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
        </div>
        <span className="font-mono text-xs text-mute">
          preview · first {previewSegments.length} segments
        </span>
        <span className="rounded-full bg-ok/10 px-2 py-0.5 text-[10px] font-medium text-ok">
          DONE
        </span>
      </div>
      <pre className="max-h-[60vh] overflow-y-auto px-5 py-5 font-mono text-[13px] leading-relaxed text-bone">
        {previewSegments.map((seg) => (
          <div key={seg.index} className="mb-5">
            <div className="text-mute">{seg.index}</div>
            <div className="text-mute">
              {msToSrtTs(seg.startMs)} --&gt; {msToSrtTs(seg.endMs)}
            </div>
            <div className="font-arabic text-base text-bone" dir="rtl">
              {seg.text}
            </div>
          </div>
        ))}
        {remaining > 0 && (
          <div className="border-t border-line pt-4 text-center text-mute">
            … and {remaining} more segments (download to see all)
          </div>
        )}
      </pre>
    </div>
  );
}

function FooterCta({ jobId: _jobId }: { jobId: string }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-surface/30 px-6 py-5 backdrop-blur sm:flex-row sm:px-8">
      <p className="text-sm text-mute">
        <span className="font-arabic text-base text-bone" dir="rtl">
          نحكي بالتونسي.
        </span>{" "}
        <span className="text-bone">We get it.</span> Need more?
      </p>
      <Link
        href="/transcribe"
        className="rounded-full border border-line bg-ink px-5 py-2.5 text-sm font-medium text-bone hover:border-mute"
      >
        Transcribe another file
      </Link>
    </div>
  );
}
