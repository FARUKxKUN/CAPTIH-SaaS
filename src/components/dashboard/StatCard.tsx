"use client";

import type { ReactNode } from "react";

type Trend = "up" | "down" | "flat";

type StatCardProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  trend?: { pct: number; direction: Trend; period: string };
  hint?: string;
  highlight?: boolean;
  /** Inline mini visualization — sparkline / ring / mini bars. */
  viz?: ReactNode;
};

/**
 * Modern KPI card with optional inline visualization on the right.
 * Inspired by Stripe / Linear / dashboard reference designs.
 */
export function StatCard({
  label,
  value,
  unit,
  trend,
  hint,
  highlight = false,
  viz,
}: StatCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 backdrop-blur transition-transform duration-300 ease-[var(--ease-spring)] hover:-translate-y-0.5 sm:p-6 ${
        highlight
          ? "border-signal/40 bg-gradient-to-b from-signal/10 to-surface/60"
          : "border-line bg-surface/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-mute">
          {label}
        </span>
        {trend && <TrendBadge {...trend} />}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-medium leading-none tracking-tight text-bone sm:text-4xl">
            {value}
          </span>
          {unit && <span className="text-sm text-mute">{unit}</span>}
        </div>
        {viz && <div className="flex-shrink-0">{viz}</div>}
      </div>

      {hint && <p className="mt-3 text-xs text-mute">{hint}</p>}
    </div>
  );
}

function TrendBadge({
  pct,
  direction,
  period,
}: {
  pct: number;
  direction: Trend;
  period: string;
}) {
  const isUp = direction === "up";
  const isFlat = direction === "flat";
  const color = isFlat
    ? "bg-mute/10 text-mute"
    : isUp
      ? "bg-ok/10 text-ok"
      : "bg-signal/10 text-signal";
  const arrow = isFlat ? "→" : isUp ? "↑" : "↓";
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${color}`}
      title={`vs ${period}`}
    >
      <span aria-hidden>{arrow}</span>
      {Math.abs(pct)}%
    </span>
  );
}
