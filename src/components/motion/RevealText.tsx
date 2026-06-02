"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { setupGsap, gsap, ScrollTrigger, HOP_EASE, prefersReducedMotion } from "@/lib/motion";

type RevealTextProps = {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  /** DOM id forwarded to the rendered element (used for aria-labelledby targets) */
  id?: string;
  /** Stagger between chars in seconds (default 0.018) */
  stagger?: number;
  /** Animation duration in seconds (default 0.85) */
  duration?: number;
  /** Delay before start in seconds (default 0) */
  delay?: number;
  /** Auto-play on mount instead of on scroll (default false) */
  immediate?: boolean;
};

/**
 * Char-by-char rise/fade reveal. Uses GSAP + HOP ease for brand cohesion.
 * Renders accessibly — preserves the original text in aria-label, the spans are hidden from a11y tree.
 */
export function RevealText({
  children,
  as = "span",
  className = "",
  id,
  stagger = 0.018,
  duration = 0.85,
  delay = 0,
  immediate = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const Component = as;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setupGsap();

    const chars = el.querySelectorAll<HTMLElement>(".reveal-char");
    if (!chars.length) return;

    if (prefersReducedMotion()) {
      chars.forEach((c) => {
        c.style.opacity = "1";
        c.style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tween = gsap.to(chars, {
        opacity: 1,
        y: 0,
        duration,
        ease: HOP_EASE,
        stagger,
        delay,
        scrollTrigger: immediate
          ? undefined
          : { trigger: el, start: "top 85%", once: true },
      });
      return () => tween.kill();
    }, el);

    return () => ctx.revert();
  }, [stagger, duration, delay, immediate, children]);

  return (
    <Component ref={ref as never} id={id} className={className} aria-label={children}>
      {splitToChars(children)}
    </Component>
  );
}

function splitToChars(text: string): ReactNode {
  return text.split(/(\s+)/).map((token, wi) => {
    if (token.match(/^\s+$/)) return <span key={`w-${wi}`}>{token}</span>;
    return (
      <span key={`w-${wi}`} className="reveal-word" aria-hidden="true">
        {Array.from(token).map((char, ci) => (
          <span key={`c-${wi}-${ci}`} className="reveal-char">
            {char}
          </span>
        ))}
      </span>
    );
  });
}
