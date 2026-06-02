"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyUsagePoint } from "@/lib/stats";

export function UsageChart({ data }: { data: DailyUsagePoint[] }) {
  const allZero = data.every((d) => d.minutes === 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/40 backdrop-blur">
      <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
        <div>
          <h3 className="font-display text-sm font-medium text-bone">
            Usage over time
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-mute">
            Last {data.length} days · minutes transcribed
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-signal">
          Live
        </span>
      </div>

      <div className="relative h-[260px] w-full px-2 py-4">
        {allZero ? (
          <div className="flex h-full items-center justify-center text-xs text-mute">
            No transcriptions yet — drop your first file to see your stats.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...data]}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="bar-saffron" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5C2B" stopOpacity={1} />
                  <stop offset="100%" stopColor="#FF5C2B" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#1E1E26"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#8A857C", fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={{ stroke: "#1E1E26" }}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis
                tick={{ fill: "#8A857C", fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255, 92, 43, 0.08)" }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="minutes"
                fill="url(#bar-saffron)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

type TooltipBag = {
  active?: boolean;
  payload?: Array<{ payload: DailyUsagePoint }>;
};

function CustomTooltip(props: TooltipBag) {
  if (!props.active || !props.payload?.length) return null;
  const data = props.payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-ink/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
        {data.label}
      </p>
      <p className="mt-1 font-display text-base font-medium text-bone">
        {data.minutes}{" "}
        <span className="text-xs text-mute">
          min · {data.files} file{data.files === 1 ? "" : "s"}
        </span>
      </p>
    </div>
  );
}
