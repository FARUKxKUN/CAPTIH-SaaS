"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const lerp = (current: number, target: number, factor: number) =>
  current * (1 - factor) + target * factor;

type MagneticProps = {
  children: ReactNode;
  /** Trigger zone radius in pixels (default 100) */
  radius?: number;
  /** Pull strength (default 0.3) */
  strength?: number;
  /** Lerp factor (default 0.18) — lower = smoother */
  smoothing?: number;
} & HTMLAttributes<HTMLDivElement>;

export function Magnetic({
  children,
  radius = 100,
  strength = 0.3,
  smoothing = 0.18,
  className,
  ...rest
}: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const state = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        state.tx = dx * strength;
        state.ty = dy * strength;
        el.dataset.magneticActive = "true";
      } else {
        state.tx = 0;
        state.ty = 0;
        delete el.dataset.magneticActive;
      }
    };

    const tick = () => {
      state.x = lerp(state.x, state.tx, smoothing);
      state.y = lerp(state.y, state.ty, smoothing);
      el.style.transform = `translate(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [radius, strength, smoothing]);

  return (
    <div ref={ref} data-magnetic="" className={className} {...rest}>
      {children}
    </div>
  );
}
