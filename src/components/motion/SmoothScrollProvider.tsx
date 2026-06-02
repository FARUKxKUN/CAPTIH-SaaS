"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { setupGsap, gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupGsap();
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
