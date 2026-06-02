"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  formatBytes,
  formatDuration,
  msToSrtTs,
  fileBaseName,
  safeDownloadName,
  segmentsToSrt,
  segmentsToTxt,
  type TranscribeJob,
} from "@/lib/transcribe";
import { getJob } from "@/lib/jobStorage";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignUpToDownloadModal } from "@/components/SignUpToDownloadModal";

type Params = { id: string };
type DownloadKind = "srt" | "txt";

export default function ResultPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  const [job, setJob] = useState<TranscribeJob | null | undefined>(undefined);

  useEffect(() => {
    setJob(getJob(id));
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
  const previewSegments = job.segments.slice(0, 30);
  const remaining = job.segments.length - previewSegments.length;

  return (
    <>
      <Header job={job} />
      <Downloads job={job} />
      <Preview previewSegments={previewSegments} remaining={remaining} />
      <FooterCta jobId={job.id} />
    </>
  );
}

function Header({ job }: { job: TranscribeJob }) {
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
        {job.segments.length} segments
      </p>
    </div>
  );
}

function Downloads({ job }: { job: TranscribeJob }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const base = safeDownloadName(fileBaseName(job.filename));
  const autoDownloadFired = useRef(false);

  // Modal gate state
  const [modalFormat, setModalFormat] = useState<DownloadKind | null>(null);

  // Real auth check — no dev bypass here. Modal handles the dev case.
  const canDownload = isLoaded && isSignedIn;

  // The actual blob-creation routine — pure, no gate check
  const triggerDownload = useCallback(
    (kind: DownloadKind) => {
      const content =
        kind === "srt"
          ? segmentsToSrt(job.segments)
          : segmentsToTxt(job.segments);
      const blob = new Blob([content], {
        type:
          kind === "srt" ? "application/x-subrip" : "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.${kind}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [job.segments, base]
  );

  // Resume after sign-up: ?download=srt|txt → trigger download → go to dashboard
  useEffect(() => {
    if (autoDownloadFired.current) return;
    if (!canDownload) return;
    const fmt = searchParams.get("download");
    if (fmt !== "srt" && fmt !== "txt") return;

    autoDownloadFired.current = true;

    // Strip the query param so refresh doesn't loop
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("download");
    window.history.replaceState({}, "", cleanUrl.toString());

    // Tiny delay so the page paints before download dialog fires
    const timer = setTimeout(() => {
      triggerDownload(fmt as DownloadKind);
      // Then nudge to dashboard with welcome flag
      setTimeout(() => router.push("/dashboard?welcome=true"), 1200);
    }, 300);

    return () => clearTimeout(timer);
  }, [canDownload, searchParams, router, triggerDownload]);

  const handleDownload = (kind: DownloadKind) => {
    if (canDownload) {
      triggerDownload(kind);
      return;
    }
    // Show the in-page modal instead of redirecting
    setModalFormat(kind);
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
    </>
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
