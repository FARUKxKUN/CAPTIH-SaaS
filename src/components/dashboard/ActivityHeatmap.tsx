"use client";

import type { DailyUsagePoint } from "@/lib/stats";

/**
 * Calendar-style activity heatmap — last N days as a grid of squares,
 * intensity scaled to minutes transcribed. Inspired by the GitHub contribution graph.
 */

type ActivityHeatmapProps = {
  data: ReadonlyArray<DailyUsagePoint>;
};

const COLOR_STEPS = [
  "#16161C", // 0 — empty, surface-ish
  "rgba(255, 92, 43, 0.25)",
  "rgba(255, 92, 43, 0.5)",
  "rgba(255, 92, 43, 0.75)",
  "#FF5C2B",
];

function intensityBucket(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const pct = value / max;
  if (pct < 0.25) return 1;
  if (pct < 0.5) return 2;
  if (pct < 0.75) return 3;
  return 4;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const max = data.reduce((m, d) => Math.max(m, d.minutes), 0);
  const totalMinutes = Math.round(data.reduce((s, d) => s + d.minutes, 0));
  const activeDays = data.filter((d) => d.minutes > 0).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/40 backdrop-blur">
      <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
        <div>
          <h3 className="font-display text-sm font-medium text-bone">Activity</h3>
          <p className="mt-0.5 font-mono text-[11px] text-mute">
            {activeDays} active day{activeDays === 1 ? "" : "s"} · {totalMinutes} min total
          </p>
        </div>
        <Legend />
      </div>

      <div className="p-5">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${Math.min(data.length, 30)}, 1fr)`,
          }}
        >
          {data.map((d) => {
            const bucket = intensityBucket(d.minutes, max);
            const color = COLOR_STEPS[bucket];
            return (
              <div
                key={d.date}
                title={`${d.label} — ${d.minutes} min · ${d.files} file${d.files === 1 ? "" : "s"}`}
                className="aspect-square rounded-[3px] transition-transform hover:scale-110"
                style={{ background: color, minWidth: 0 }}
              />
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-mute">
          <span>{data[0]?.label ?? ""}</span>
          <span>today</span>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <span className="font-mono text-[10px] text-mute">less</span>
      {COLOR_STEPS.map((c, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-[2px]"
          style={{ background: c }}
          aria-hidden
        />
      ))}
      <span className="font-mono text-[10px] text-mute">more</span>
    </div>
  );
}
