"use client";

import { useEffect, useRef } from "react";
import { COPY } from "@/lib/copy";
import { setupGsap, gsap, HOP_EASE, prefersReducedMotion } from "@/lib/motion";

/**
 * The "soul" section — Rubin's note: the page reads like a pricing page, not
 * like something that was made. This is the cut that reveals what's always been
 * true: two Tunisians built this for Tunisians.
 *
 * No card. No border. No gimmick. Just a letter, signed.
 */
export function OurStorySection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('[data-story="line"]', {
        y: 18,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: HOP_EASE,
        scrollTrigger: { trigger: el, start: "top 75%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const s = COPY.story;

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="story-headline"
    >
      <div className="mx-auto max-w-3xl px-6 py-32 sm:px-10 sm:py-40">
        {/* Avatars + eyebrow */}
        <div data-story="line" className="mb-10 flex items-center gap-4">
          <FoundersAvatars />
          <p className="font-mono text-xs uppercase tracking-wider text-signal">
            {s.eyebrow}
          </p>
        </div>

        {/* Headline */}
        <h2
          id="story-headline"
          data-story="line"
          className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-bone sm:text-5xl md:text-6xl"
        >
          {s.headline}
        </h2>

        {/* Letter body — left-aligned, generous line-height, no cards */}
        <div className="mt-12 space-y-6 text-lg leading-[1.7] text-bone/85 sm:text-xl sm:leading-[1.65]">
          {s.paragraphs.map((p, i) => (
            <p
              key={i}
              data-story="line"
              className={i === 0 ? "first-letter:font-display first-letter:text-5xl first-letter:font-medium first-letter:text-signal first-letter:mr-1 first-letter:float-left first-letter:leading-[0.95]" : ""}
            >
              {p}
            </p>
          ))}
        </div>

        {/* Bilingual signoff — the relationship language Rubin pointed to */}
        <div data-story="line" className="mt-14 border-l-2 border-signal pl-6">
          <p
            className="font-arabic text-2xl font-medium leading-tight text-bone sm:text-3xl"
            dir="rtl"
          >
            {s.arabicSignoff}
          </p>
          <p className="mt-2 font-display text-xl font-medium tracking-tight text-bone sm:text-2xl">
            {s.englishSignoff}
          </p>
        </div>

        {/* Signature */}
        <p
          data-story="line"
          className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-mute"
        >
          — {s.signature}
        </p>
      </div>
    </section>
  );
}

function FoundersAvatars() {
  return (
    <div
      className="flex items-center"
      aria-label="Faruk and Yassine"
    >
      <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-signal font-display text-sm font-medium text-white">
        F
      </span>
      <span className="-ml-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-ok/80 font-display text-sm font-medium text-ink">
        Y
      </span>
    </div>
  );
}
