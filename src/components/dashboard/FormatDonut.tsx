"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { FormatBreakdown } from "@/lib/stats";

export function FormatDonut({ breakdown }: { breakdown: FormatBreakdown }) {
  const total = breakdown.audio + breakdown.video;
  const data =
    total === 0
      ? [{ name: "No data", value: 1, color: "#1E1E26" }]
      : [
          { name: "Video", value: breakdown.video, color: "#FF5C2B" },
          { name: "Audio", value: breakdown.audio, color: "#7CE2B1" },
        ];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/40 backdrop-blur">
      <div className="border-b border-line px-5 py-3">
        <h3 className="font-display text-sm font-medium text-bone">Formats</h3>
        <p className="mt-0.5 font-mono text-[11px] text-mute">
          Audio vs video breakdown
        </p>
      </div>

      <div className="relative flex flex-col items-center px-5 py-6">
        <div className="relative h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={total === 0 ? 0 : 2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-medium text-bone">
              {total}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
              files
            </span>
          </div>
        </div>

        <ul className="mt-6 w-full space-y-2">
          <LegendRow
            color="#FF5C2B"
            label="Video"
            count={breakdown.video}
            total={total}
          />
          <LegendRow
            color="#7CE2B1"
            label="Audio"
            count={breakdown.audio}
            total={total}
          />
        </ul>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  count,
  total,
}: {
  color: string;
  label: string;
  count: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <li className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        <span className="text-bone">{label}</span>
      </span>
      <span className="font-mono text-mute">
        {count} · {pct}%
      </span>
    </li>
  );
}
