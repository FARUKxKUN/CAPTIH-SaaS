"use client";

import { useEffect, useRef } from "react";
import { COPY } from "@/lib/copy";
import { setupGsap, gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";
import { RevealText } from "./motion/RevealText";
import { Waveform } from "./Brand";

export function HowItWorksSection() {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const steps = COPY.how.steps;

  useEffect(() => {
    const el = pinRef.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".how-item", el);
      const visuals = gsap.utils.toArray<HTMLElement>(".how-visual", el);
      const fill = el.querySelector<HTMLElement>(".how-fill");
      if (!items.length || !visuals.length || !fill) return;

      gsap.set(fill, { scaleY: 1 / items.length, transformOrigin: "top left" });
      gsap.set(items[0], { color: "var(--color-bone)", opacity: 1 });
      gsap.set(visuals[0], { autoAlpha: 1 });
      for (let i = 1; i < items.length; i++) {
        gsap.set(items[i], { opacity: 0.35 });
        gsap.set(visuals[i], { autoAlpha: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: `+=${items.length * 65}%`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      items.forEach((item, i) => {
        if (i === 0) return;
        tl.to(item, { opacity: 1, color: "var(--color-bone)", duration: 0.2 }, 0.5 * i)
          .to(visuals[i], { autoAlpha: 1, duration: 0.25 }, "<")
          .to(items[i - 1], { opacity: 0.35, duration: 0.2 }, "<")
          .to(visuals[i - 1], { autoAlpha: 0, duration: 0.25 }, "<");
      });

      tl.to(fill, { scaleY: 1, ease: "none", duration: tl.duration() }, 0);
      tl.to({}, { duration: 0.3 });

      ScrollTrigger.refresh();
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="how" data-collision aria-labelledby="how-heading" className="relative">
      <SectionHeader eyebrow={COPY.how.eyebrow} headline={COPY.how.headline} sub={COPY.how.sub} />

      <div
        ref={pinRef}
        className="relative mx-auto flex h-screen w-full max-w-7xl items-center px-6 sm:px-10"
      >
        <div className="grid w-full grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {/* Left: step list with fill bar */}
          <div className="relative pl-8">
            <div
              className="how-fill absolute left-0 top-0 w-px"
              style={{ height: "100%", background: "var(--color-signal)" }}
            />
            <ul className="space-y-12">
              {steps.map((s) => (
                <li key={s.n} className="how-item transition-opacity">
                  <div className="font-mono text-xs text-signal">{s.n}</div>
                  <h3 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-md text-base text-mute">{s.body}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: visuals stack */}
          <div className="relative h-[420px]">
            <StepVisual visual="drop" />
            <StepVisual visual="listen" />
            <StepVisual visual="download" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StepVisual({ visual }: { visual: "drop" | "listen" | "download" }) {
  return (
    <div className="how-visual absolute inset-0 flex items-center justify-center">
      {visual === "drop" && <DropVisual />}
      {visual === "listen" && <ListenVisual />}
      {visual === "download" && <DownloadVisual />}
    </div>
  );
}

function DropVisual() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex h-64 w-full max-w-md flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface/40 px-8 text-center">
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-signal" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
          <path d="M5 21h14" />
        </svg>
        <p className="font-display text-lg text-bone">Drop your file here</p>
        <p className="font-mono text-xs text-mute">MP4 · MOV · MP3 · WAV</p>
      </div>
    </div>
  );
}

function ListenVisual() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface/70 p-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-mute">episode-03.mp3</span>
          <span className="flex items-center gap-2 rounded-full bg-signal/15 px-2 py-0.5 text-[10px] font-medium text-signal">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
            LISTENING
          </span>
        </div>
        <Waveform className="mt-4 h-16 w-full text-signal" bars={42} />
        <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[11px] text-mute">
          <div>00:42 / 12:18</div>
          <div className="text-center">100h+ trained</div>
          <div className="text-right text-bone">~3 min ETA</div>
        </div>
      </div>
    </div>
  );
}

function DownloadVisual() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-full max-w-md space-y-3">
        <DownloadRow icon="srt" label="episode-03.srt" size="14.2 KB" />
        <DownloadRow icon="txt" label="episode-03.txt" size="9.8 KB" />
        <DownloadRow icon="json" label="episode-03.json" size="22.6 KB" />
      </div>
    </div>
  );
}

function DownloadRow({ icon, label, size }: { icon: string; label: string; size: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink font-mono text-[10px] uppercase text-signal">
          {icon}
        </span>
        <div>
          <p className="font-mono text-sm text-bone">{label}</p>
          <p className="font-mono text-[11px] text-mute">{size}</p>
        </div>
      </div>
      <span className="rounded-full bg-signal px-3 py-1 text-xs font-medium text-ink">↓</span>
    </div>
  );
}

function SectionHeader({ eyebrow, headline, sub }: { eyebrow: string; headline: string; sub: string }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-24 pb-12 sm:px-10 sm:pt-32 sm:pb-16">
      <p className="font-mono text-xs uppercase tracking-wider text-signal">{eyebrow}</p>
      <RevealText
        as="h2"
        id="how-heading"
        className="mt-3 max-w-3xl font-display text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl md:text-6xl"
      >
        {headline}
      </RevealText>
      <p className="mt-4 max-w-xl text-base text-mute sm:text-lg">{sub}</p>
    </div>
  );
}
