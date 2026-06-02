"use client";

/**
 * Tiny bar chart for inline use in KPI cards.
 * Renders the last N values as vertical bars, last bar highlighted.
 */

type MiniBarsProps = {
  data: ReadonlyArray<number>;
  width?: number;
  height?: number;
  color?: string;
  mutedColor?: string;
  className?: string;
};

export function MiniBars({
  data,
  width = 100,
  height = 36,
  color = "#FF5C2B",
  mutedColor = "#1E1E26",
  className = "",
}: MiniBarsProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const gap = 2;
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      {data.map((value, i) => {
        const h = Math.max(2, (value / max) * height);
        const x = i * (barWidth + gap);
        const y = height - h;
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={1.5}
            fill={isLast ? color : value === 0 ? mutedColor : `${color}60`}
          />
        );
      })}
    </svg>
  );
}
