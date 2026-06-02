"use client";

import Link from "next/link";
import { useState } from "react";
import {
  EXAMPLE_SAMPLES,
  type ExampleSample,
  getExampleById,
} from "@/lib/examples";
import { formatDuration } from "@/lib/transcribe";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Waveform } from "@/components/Brand";

export default function ExamplesPage() {
  const [activeId, setActiveId] = useState<string>(EXAMPLE_SAMPLES[0].id);
  const active = getExampleById(activeId) ?? EXAMPLE_SAMPLES[0];

  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col px-6 pb-24 pt-32 sm:px-10 sm:pt-40">
        <div className="mx-auto w-full max-w-6xl">
          <Header />
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1.4fr] lg:gap-8">
            <SampleList active={activeId} onSelect={setActiveId} />
            <TranscriptView sample={active} />
          </div>
          <BottomCta />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Header() {
  return (
    <div className="text-center sm:text-left">
      <p className="font-mono text-xs uppercase tracking-wider text-signal">
        Examples
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight text-bone sm:text-5xl md:text-6xl">
        Real Tunisian, really transcribed.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-mute sm:text-lg">
        Four use cases — Reels, Podcasts, News, Voice notes — each with the
        actual SRT output. Click a sample on the left to see its full transcript.
      </p>
      <p className="mt-3 text-sm text-mute">
        <span className="font-arabic text-base text-bone" dir="rtl">
          صوتك بالتونسي.
        </span>{" "}
        <span className="text-bone">Your voice, in your language.</span>
      </p>
    </div>
  );
}

function SampleList({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-3">
      {EXAMPLE_SAMPLES.map((sample) => (
        <li key={sample.id}>
          <SampleCard
            sample={sample}
            active={sample.id === active}
            onClick={() => onSelect(sample.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function SampleCard({
  sample,
  active,
  onClick,
}: {
  sample: ExampleSample;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-300 ease-[var(--ease-spring)] ${
        active
          ? "border-signal/50 bg-gradient-to-b from-signal/10 to-surface/40 shadow-lg shadow-signal/5"
          : "border-line bg-surface/40 hover:-translate-y-0.5 hover:border-mute"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-signal">
          <UseCaseIcon kind={sample.icon} />
          {sample.useCase}
        </span>
        <span className="font-mono text-[10px] text-mute">
          {formatDuration(sample.durationSec)}
        </span>
      </div>

      <div>
        <h3 className="font-display text-lg font-medium tracking-tight text-bone">
          {sample.title}
        </h3>
        <p className="mt-1 font-mono text-[11px] text-mute">{sample.filename}</p>
      </div>

      <Waveform
        className={`h-8 w-full ${active ? "text-signal" : "text-mute"}`}
        bars={36}
      />

      <p className="line-clamp-2 text-xs leading-relaxed text-mute">
        {sample.description}
      </p>
    </button>
  );
}

function TranscriptView({ sample }: { sample: ExampleSample }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface/70 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
        </div>
        <span className="font-mono text-xs text-mute">
          {sample.filename}.srt
        </span>
        <span className="rounded-full bg-ok/10 px-2 py-0.5 text-[10px] font-medium text-ok">
          DONE
        </span>
      </div>

      <div className="max-h-[65vh] overflow-y-auto p-6">
        <ol className="space-y-5">
          {sample.segments.map((seg) => (
            <li
              key={seg.index}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[100px_1fr] sm:gap-5"
            >
              <div className="font-mono text-[11px] leading-snug text-mute">
                <div className="text-signal">#{seg.index}</div>
                <div className="mt-1">{seg.start}</div>
                <div>→ {seg.end}</div>
              </div>
              <div
                className="font-arabic text-lg leading-relaxed text-bone"
                dir="rtl"
              >
                {seg.text}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-ink/40 px-6 py-3 text-xs">
        <span className="font-mono text-mute">
          {sample.segments.length} segments · {formatDuration(sample.durationSec)}
        </span>
        <span className="font-mono text-[11px] text-mute">
          Transcribed by{" "}
          <a
            href="https://huggingface.co/FARUKxAUTO"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone underline-offset-2 hover:text-signal hover:underline"
          >
            FARUKxAUTO
          </a>
        </span>
      </div>
    </div>
  );
}

function BottomCta() {
  return (
    <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-line bg-surface/30 px-8 py-10 text-center backdrop-blur sm:py-12">
      <p className="font-mono text-xs uppercase tracking-wider text-signal">
        Your turn
      </p>
      <h2 className="max-w-2xl font-display text-2xl font-medium tracking-tight text-bone sm:text-3xl">
        Drop your own file. See your own voice transcribed in minutes.
      </h2>
      <p className="max-w-xl text-sm text-mute sm:text-base">
        Free trial — 3 minutes on us, no card required.
      </p>
      <Link
        href="/transcribe"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-base font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
      >
        Captiiiih it
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

function UseCaseIcon({ kind }: { kind: ExampleSample["icon"] }) {
  const common = "h-3.5 w-3.5 flex-shrink-0 stroke-current";
  switch (kind) {
    case "reel":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9.5 8.5l6 3.5-6 3.5v-7z" />
        </svg>
      );
    case "podcast":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0014 0M12 18v3" />
        </svg>
      );
    case "news":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 4h13v16H4z" />
          <path d="M17 8h3v9a3 3 0 01-3 3M8 8h5M8 12h5M8 16h5" />
        </svg>
      );
    case "convo":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11a8 8 0 11-3.7 6.7L3 21l3.3-7.3A8 8 0 0121 11z" />
        </svg>
      );
  }
}
