"use client";

import { useEffect, useRef } from "react";
import { COPY } from "@/lib/copy";
import { setupGsap, gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";
import { RevealText } from "./motion/RevealText";

export function ComparisonSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const after = el.querySelector<HTMLElement>(".cmp-after");
      const afterInner = el.querySelector<HTMLElement>(".cmp-after-inner");
      const divider = el.querySelector<HTMLElement>(".cmp-divider");
      if (!after || !afterInner) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "center center",
          end: () => `+=${el.offsetWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
        defaults: { ease: "none" },
      });

      tl.fromTo(after, { xPercent: 100, x: 0 }, { xPercent: 0 }, 0)
        .fromTo(afterInner, { xPercent: -100, x: 0 }, { xPercent: 0 }, 0);

      if (divider) {
        tl.fromTo(divider, { x: () => el.offsetWidth }, { x: 0 }, 0);
      }

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="vs" data-collision aria-labelledby="vs-heading" className="relative">
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-12 sm:px-10 sm:pt-32 sm:pb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-signal">{COPY.vs.eyebrow}</p>
        <RevealText
          as="h2"
          id="vs-heading"
          className="mt-3 max-w-3xl font-display text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl md:text-6xl"
        >
          {COPY.vs.headline}
        </RevealText>
        <p className="mt-4 max-w-2xl text-base text-mute sm:text-lg">{COPY.vs.sub}</p>
      </div>

      <div
        ref={sectionRef}
        className="relative mx-auto w-full max-w-5xl px-6 sm:px-10"
        style={{ aspectRatio: "16 / 9" }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line bg-surface/40">
          {/* Before */}
          <TranscriptPanel
            variant="before"
            label={COPY.vs.beforeLabel}
            lines={COPY.vs.beforeContent}
          />

          {/* After (wipes in) */}
          <div className="cmp-after absolute inset-0 overflow-hidden">
            <div className="cmp-after-inner h-full w-full">
              <TranscriptPanel
                variant="after"
                label={COPY.vs.afterLabel}
                lines={COPY.vs.afterContent}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="cmp-divider pointer-events-none absolute top-0 z-10 h-full w-px bg-signal shadow-[0_0_20px_var(--color-signal)]" />
        </div>

        <p className="mt-4 text-center font-mono text-xs text-mute">
          ← scroll to reveal Captih's output →
        </p>
      </div>
    </section>
  );
}

function TranscriptPanel({
  variant,
  label,
  lines,
}: {
  variant: "before" | "after";
  label: string;
  lines: readonly { ts: string; text: string }[];
}) {
  const isAfter = variant === "after";
  return (
    <div
      className={`flex h-full w-full flex-col ${
        isAfter ? "bg-gradient-to-br from-surface to-ink" : "bg-gradient-to-br from-[#1A1A1F] to-[#0E0E11]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isAfter ? "bg-ok" : "bg-mute"}`} />
          <span className="font-mono text-xs text-mute">{label}</span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isAfter ? "bg-ok/10 text-ok" : "bg-mute/10 text-mute"
          }`}
        >
          {isAfter ? "ACCURATE" : "BROKEN"}
        </span>
      </div>
      <pre className="flex-1 overflow-hidden p-6 font-mono text-[14px] leading-relaxed sm:text-base md:text-lg">
        {lines.map((l, i) => (
          <div key={i} className="mb-4">
            <div className="text-mute">{i + 1}</div>
            <div className="text-mute">{l.ts}</div>
            <div
              className={
                isAfter ? "font-arabic text-bone" : "italic text-mute/70 line-through decoration-mute/40"
              }
              dir={isAfter ? "rtl" : "ltr"}
            >
              {l.text}
            </div>
          </div>
        ))}
      </pre>
    </div>
  );
}
