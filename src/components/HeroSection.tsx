"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { setupGsap, gsap, HOP_EASE, prefersReducedMotion } from "@/lib/motion";
import { Magnetic } from "./motion/Magnetic";
import { ShinyCta } from "./motion/ShinyCta";
import { Captih3DLogo } from "./Captih3DLogo";
import { Underline } from "./Brand";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [pre, accent] = COPY.hero.headline;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    setupGsap();

    if (prefersReducedMotion()) {
      el.querySelectorAll<HTMLElement>("[data-hop]").forEach((node) => {
        node.style.opacity = "1";
        node.style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: HOP_EASE } });
      tl.from('[data-hop="badge"]', { y: 12, opacity: 0, duration: 0.6 }, 0)
        .from('[data-hop="line"]', { y: 28, opacity: 0, duration: 0.9, stagger: 0.06 }, 0.05)
        .from('[data-hop="underline"]', { scaleX: 0, transformOrigin: "left center", duration: 0.7 }, 0.55)
        .from('[data-hop="sub"]', { y: 12, opacity: 0, duration: 0.7 }, 0.35)
        .from('[data-hop="bilingual"]', { y: 12, opacity: 0, duration: 0.7 }, 0.45)
        .from('[data-hop="cta"]', { y: 12, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.5)
        .from('[data-hop="video"]', { x: 40, opacity: 0, duration: 1.1 }, 0.15)
        .from('[data-hop="srt"]', { y: 40, opacity: 0, duration: 1.0, stagger: 0.12 }, 0.75);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-start justify-center px-6 pb-24 pt-32 sm:px-10 sm:pb-32 sm:pt-40"
    >
      {/* Two-column hero — video lifted up to align with the headline area */}
      <div className="grid w-full grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-12 xl:gap-16">
        {/* LEFT — text + CTAs */}
        <div className="flex flex-col items-start">
          <div
            data-hop="badge"
            className="mb-8 inline-flex items-center gap-3 rounded-full border border-line bg-surface/60 px-3 py-1.5 backdrop-blur"
          >
            <span className="font-mono text-xs text-mute">{COPY.hero.badge}</span>
            <span className="h-3 w-px bg-line" aria-hidden />
            <span className="text-xs text-bone">{COPY.hero.badgeLabel}</span>
          </div>

          <h1 id="hero-heading" className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-bone sm:text-5xl md:text-6xl lg:text-[58px] xl:text-[68px]">
            <span data-hop="line" className="inline-block">{pre}</span>
            <span data-hop="line" className="relative inline-block text-signal">
              {accent}
              <Underline
                data-hop="underline"
                className="absolute -bottom-2 left-0 h-3 w-full text-signal/70"
              />
            </span>
          </h1>

          <p data-hop="sub" className="mt-8 max-w-xl text-base leading-relaxed text-mute sm:text-lg">
            {COPY.hero.sub}
          </p>

          <p data-hop="bilingual" className="mt-5 text-sm text-mute">
            <span className="text-bone">Nobody else does.</span>{" "}
            <span className="font-arabic text-base text-bone" dir="rtl">
              شكون غيري لي بش يفهمك؟
            </span>
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span data-hop="cta">
              <ShinyCta href="/transcribe">
                {COPY.hero.ctaPrimary}
                <span aria-hidden>→</span>
              </ShinyCta>
            </span>
            <span data-hop="cta">
              <Magnetic radius={80} strength={0.25} smoothing={0.18}>
                <Link
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface/40 px-7 py-4 text-base font-medium text-bone transition-colors hover:border-mute"
                >
                  {COPY.hero.ctaSecondary}
                  <span aria-hidden className="text-mute">↓</span>
                </Link>
              </Magnetic>
            </span>
          </div>
        </div>

        {/* RIGHT — interactive 3D logo, cursor-reactive, breathing */}
        <div data-hop="video" className="relative w-full lg:-mt-12">
          <Captih3DLogo />
        </div>
      </div>

      {/* Proof zone: artifact preview (left) + what-you-get companion (right) */}
      <div className="mt-24 grid w-full grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.3fr_1fr] lg:gap-8">
        <div data-hop="srt">
          <SrtPreview />
        </div>
        <div data-hop="srt">
          <WhatYouGetPanel />
        </div>
      </div>
    </section>
  );
}


function SrtPreview() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface/70 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
        </div>
        <span className="font-mono text-xs text-mute">episode-03.srt</span>
        <span className="rounded-full bg-ok/10 px-2 py-0.5 text-[10px] font-medium text-ok">
          DONE
        </span>
      </div>
      <pre className="flex-1 overflow-x-auto px-5 py-5 font-mono text-[13px] leading-relaxed text-bone">
        <span className="text-mute">1</span>{"\n"}
        <span className="text-mute">00:00:00,420 --&gt; 00:00:03,180</span>{"\n"}
        <span className="font-arabic" dir="rtl">أهلا بيكم في الحلقة الجديدة متاع البودكاست،</span>{"\n\n"}
        <span className="text-mute">2</span>{"\n"}
        <span className="text-mute">00:00:03,180 --&gt; 00:00:06,920</span>{"\n"}
        <span className="font-arabic" dir="rtl">اليوم باش نحكيو على موضوع يهم كل واحد فينا.</span>{"\n\n"}
        <span className="text-mute">3</span>{"\n"}
        <span className="text-mute">00:00:06,920 --&gt; 00:00:09,</span><span className="caret" />
      </pre>
    </div>
  );
}

function WhatYouGetPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface/70 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="font-mono text-xs uppercase tracking-wider text-mute">
          What you get
        </span>
        <span className="rounded-full bg-signal/10 px-2 py-0.5 text-[10px] font-medium text-signal">
          3 FORMATS
        </span>
      </div>
      <div className="flex flex-1 flex-col divide-y divide-line">
        <FormatRow
          ext="srt"
          name="episode-03.srt"
          desc="Timestamped subtitle file - drag straight into your video editor."
        />
        <FormatRow
          ext="txt"
          name="episode-03.txt"
          desc="Clean plain transcript - for blog posts, show notes, docs."
        />
        <FormatRow
          ext="json"
          name="episode-03.json"
          desc="Word-level timestamps + confidence - for power users and pipelines."
        />
      </div>
      <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs">
        <span className="text-mute">No signup. First 30 min free.</span>
        <span className="font-mono text-mute">
          <span className="font-arabic text-sm text-bone" dir="rtl">يلا</span>{" "}
          <span className="text-bone">go →</span>
        </span>
      </div>
    </div>
  );
}

function FormatRow({ ext, name, desc }: { ext: string; name: string; desc: string }) {
  return (
    <div className="flex flex-1 items-center gap-4 px-5 py-4">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-line bg-ink font-mono text-[10px] uppercase text-signal">
        {ext}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm text-bone">{name}</p>
        <p className="mt-0.5 text-xs text-mute">{desc}</p>
      </div>
    </div>
  );
}
