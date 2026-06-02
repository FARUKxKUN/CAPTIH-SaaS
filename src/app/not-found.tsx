import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Lost the signal · Captih",
  description: "This page wandered off. Let's get you back to transcribing.",
};

export default function NotFound() {
  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:px-10 sm:py-32">
        <div className="w-full max-w-2xl text-center">
          {/* Big SRT-style "missing segment" — feels on-brand */}
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-line bg-surface/60 px-4 py-2 backdrop-blur">
            <span className="font-mono text-xs text-signal">404</span>
            <span className="h-3 w-px bg-line" aria-hidden />
            <span className="font-mono text-xs text-mute">
              segment_not_found.srt
            </span>
          </div>

          <h1 className="mt-8 font-display text-5xl font-medium leading-[1.02] tracking-tight text-bone sm:text-6xl md:text-7xl">
            We&apos;re listening,
            <br />
            <span className="text-signal">but this page is silent.</span>
          </h1>

          <p className="mt-6 text-base text-mute sm:text-lg">
            The link is broken or the page never existed. Pick a direction
            below.
          </p>
          <p className="mt-2 text-sm text-mute">
            <span className="font-arabic text-base text-bone" dir="rtl">
              ضاع منا الصوت.
            </span>{" "}
            <span className="text-bone">Lost the signal.</span>
          </p>

          {/* SRT-style "fake segment" — playful in-brand visual */}
          <div className="mx-auto mt-10 max-w-md overflow-hidden rounded-2xl border border-line bg-surface/60 text-left backdrop-blur">
            <pre className="overflow-x-auto px-5 py-4 font-mono text-[12px] leading-relaxed text-mute">
              <span className="text-mute">404</span>
              {"\n"}
              <span className="text-mute">--:--:--,--- --&gt; --:--:--,---</span>
              {"\n"}
              <span className="font-arabic text-bone" dir="rtl">
                [ صمت طويل ]
              </span>
            </pre>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-signal px-7 py-3.5 text-base font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
            >
              Back to landing
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/transcribe"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface/40 px-7 py-3.5 text-base font-medium text-bone hover:border-mute"
            >
              Try transcribing
            </Link>
            <Link
              href="/examples"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface/40 px-7 py-3.5 text-base font-medium text-bone hover:border-mute"
            >
              See examples
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
