import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/**
 * Brand motion signature — Blacklead-style "Hop" ease.
 * Fast start, glide to rest. Used everywhere for cohesion.
 * Path: M0,0 C0.3,0 0.1,1 1,1
 */
export const HOP_EASE = "hop";

export function setupGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create(HOP_EASE, "M0,0 C0.3,0 0.1,1 1,1");
  registered = true;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
