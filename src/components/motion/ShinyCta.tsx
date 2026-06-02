"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Magnetic } from "./Magnetic";

type ShinyCtaProps = {
  href: string;
  children: ReactNode;
  className?: string;
  magnetic?: boolean;
};

/**
 * Hero-tier primary CTA. Rotating conic border + shimmer sweep + breathing halo.
 * Optionally wrapped in a Magnetic for cursor pull. Use sparingly — one per view.
 */
export function ShinyCta({ href, children, className = "", magnetic = true }: ShinyCtaProps) {
  const inner = (
    <Link href={href} className={`shiny-cta ${className}`}>
      {children}
    </Link>
  );
  if (!magnetic) return inner;
  return (
    <Magnetic radius={120} strength={0.35} smoothing={0.2}>
      {inner}
    </Magnetic>
  );
}
