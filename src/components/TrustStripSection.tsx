"use client";

import { useEffect, useRef } from "react";
import {
  setupGsap,
  gsap,
  ScrollTrigger,
  HOP_EASE,
  prefersReducedMotion,
} from "@/lib/motion";

/**
 * Slim trust strip — 4 quick proof tiles in a horizontal band. Renders
 * between the comparison section and pricing so the user lands on pricing
 * already trusting the moat. One Animated-Verb III flourish on "captured."
 *
 * Effect kit reused: Hop ease + character rise (already brand standard).
 */

type TrustItem = {
  readonly value: string;
  readonly label: string;
  readonly hint: string;
};

const ITEMS: ReadonlyArray<TrustItem> = [
  {
    value: "93",
    label: "hours trained",
    hint: "Tunisian darija audio",
  },
  {
    value: "~3 min",
    label: "per audio hour",
    hint: "CAPTIH turnaround",
  },
  {
    value: "0",
    label: "signup to try",
    hint: "3 free minutes",
  },
  {
    value: "3",
    label: "output formats",
    hint: "SRT · TXT · JSON",
  },
];

export function TrustStripSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('[data-trust="tile"]', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: HOP_EASE,
        stagger: 0.08,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });

      // "captured" word performs its meaning — animated-verbs-iii lite
      gsap.from('[data-trust="captured-char"]', {
        y: 12,
        opacity: 0,
        rotate: 8,
        duration: 0.7,
        ease: HOP_EASE,
        stagger: 0.03,
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          once: true,
        },
      });
    }, el);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  const captured = "captured".split("");

  return (
    <section
      ref={sectionRef}
      data-collision
      className="relative mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-24"
    >
      <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-baseline sm:justify-between sm:text-left">
        <p className="font-mono text-xs uppercase tracking-wider text-signal">
          Why creators trust it
        </p>
        <p
          className="mt-2 font-display text-sm font-medium text-bone sm:mt-0"
          aria-label="Real darija. Really captured."
        >
          <span className="text-mute">Real darija. Really </span>
          <span className="inline-block">
            {captured.map((c, i) => (
              <span
                key={i}
                data-trust="captured-char"
                className="inline-block text-signal"
              >
                {c}
              </span>
            ))}
          </span>
          <span className="text-mute">.</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div
            key={item.label}
            data-trust="tile"
            className="rounded-2xl border border-line bg-surface/40 p-5 backdrop-blur transition-transform duration-300 ease-[var(--ease-spring)] hover:-translate-y-0.5 sm:p-6"
          >
            <div className="font-display text-3xl font-medium leading-none text-bone sm:text-4xl">
              {item.value}
            </div>
            <div className="mt-3 font-mono text-[11px] uppercase tracking-wider text-mute">
              {item.label}
            </div>
            <div className="mt-1 text-xs text-bone">{item.hint}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
