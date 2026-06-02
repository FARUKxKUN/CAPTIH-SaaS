"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { COPY } from "@/lib/copy";
import {
  setupGsap,
  gsap,
  ScrollTrigger,
  HOP_EASE,
  prefersReducedMotion,
} from "@/lib/motion";

/**
 * Founding Members offer section.
 *
 * Sits between the Trust Strip and Pricing. Designed as a single saffron-lit
 * card that frames the launch deal: 50% off Studio for life, capped at 100
 * spots, with a visible counter to drive Hormozi-style scarcity.
 *
 * `spotsClaimed` lives in copy.ts as a hardcoded number until we have a real
 * counter wired to the database. Faruk updates it manually as people sign up.
 */
export function FoundingOfferSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const f = COPY.founding;
  const claimed = Math.min(f.spotsClaimed, f.spotsTotal);
  const remaining = Math.max(0, f.spotsTotal - claimed);
  const pct = Math.min(100, Math.round((claimed / f.spotsTotal) * 100));
  const isGone = remaining === 0;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('[data-founding="row"]', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: HOP_EASE,
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });

      gsap.fromTo(
        '[data-founding="bar"]',
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          duration: 1.3,
          ease: HOP_EASE,
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
        }
      );
    }, el);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-collision
      className="relative mx-auto max-w-5xl px-6 py-20 sm:px-10 sm:py-24"
    >
      <div className="relative overflow-hidden rounded-3xl border border-signal/40 bg-gradient-to-br from-signal/15 via-signal/8 to-surface/40 p-8 backdrop-blur sm:p-12">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-20 opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(255,92,43,0.22), transparent 70%)",
          }}
        />

        <div className="relative">
          <div
            data-founding="row"
            className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-signal">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
              {f.eyebrow}
            </span>
            <span className="font-mono text-xs text-mute">
              {isGone ? "Closed" : `${remaining} of ${f.spotsTotal} spots left`}
            </span>
          </div>

          <h2
            data-founding="row"
            className="mt-5 max-w-3xl font-display text-3xl font-medium leading-[1.1] tracking-tight text-bone sm:text-4xl md:text-5xl"
          >
            {isGone ? f.expiredHeadline : f.headline}
          </h2>
          <p data-founding="row" className="mt-4 max-w-2xl text-base text-mute sm:text-lg">
            {isGone ? f.expiredSub : f.sub}
          </p>

          {/* Counter + progress bar */}
          {!isGone && (
            <div data-founding="row" className="mt-8 max-w-md">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="text-mute">
                  <span className="text-signal">{claimed}</span> / {f.spotsTotal} claimed
                </span>
                <span className="text-bone">{pct}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  data-founding="bar"
                  className="h-full bg-gradient-to-r from-signal to-signal/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Sample-pack savings preview */}
          {!isGone && (
            <div
              data-founding="row"
              className="mt-8 inline-flex flex-col gap-1 rounded-2xl border border-line bg-ink/40 px-5 py-4"
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-mute">
                Example: {f.sampleLabel}
              </div>
              <div className="flex items-baseline gap-4">
                <div className="font-display text-2xl text-mute line-through">
                  {f.regularPriceDT} DT
                </div>
                <span className="font-mono text-mute">-&gt;</span>
                <div className="font-display text-3xl font-medium text-bone">
                  {f.foundingPriceDT} DT
                </div>
                <span className="rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-signal">
                  Save 50%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-mute">
                Same discount on every pack you buy, for life.
              </p>
            </div>
          )}

          {/* Perks grid */}
          <ul
            data-founding="row"
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {f.perks.map((perk) => (
              <li
                key={perk.title}
                className="rounded-2xl border border-line bg-surface/40 p-5"
              >
                <p className="font-display text-sm font-medium text-bone">
                  {perk.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-mute">
                  {perk.body}
                </p>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {!isGone && (
            <div
              data-founding="row"
              className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href="/sign-up?plan=founding"
                className="inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-base font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
              >
                {f.cta}
                <span aria-hidden>-&gt;</span>
              </Link>
              <p className="text-xs text-mute">{f.finePrint}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
