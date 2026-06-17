"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { setupGsap, gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";

// Header is fixed (~72px) — land the section just below it, not under it.
const HASH_OFFSET = -88;

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Scroll to a hash target via Lenis (or native when reduced-motion / no Lenis).
  const scrollToHash = (hash: string) => {
    if (!hash || hash === "#") return;
    const el = document.querySelector(hash);
    if (!el) return;
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(el as HTMLElement, { offset: HASH_OFFSET, duration: 1.1 });
    else (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setupGsap();
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    // Same-page anchor clicks ("#x" or "/#x" while already home) → Lenis-driven scroll.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!href) return;
      const hash = href.startsWith("#")
        ? href
        : href.startsWith("/#")
          ? href.slice(1)
          : null;
      if (!hash || hash === "#") return;
      // Only hijack when the target exists on the current page. Otherwise let
      // Next navigate — the pathname effect below scrolls once home renders.
      if (!document.querySelector(hash)) return;
      e.preventDefault();
      history.pushState(null, "", hash);
      scrollToHash(hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(ticker);
      lenis.destroy();
      lenisRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Honor an incoming hash on initial load and after route changes
  // (e.g. /dashboard → /#pricing). Retries briefly while the section mounts.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash === "#") return;

    let attempts = 0;
    let timer = 0;
    let raf = 0;
    const tryScroll = () => {
      if (document.querySelector(hash)) {
        scrollToHash(hash);
        return;
      }
      if (attempts++ < 25) timer = window.setTimeout(tryScroll, 60);
    };
    raf = requestAnimationFrame(() => requestAnimationFrame(tryScroll));

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}
