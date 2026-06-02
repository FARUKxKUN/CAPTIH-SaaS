"use client";

/**
 * Tiny inline trend chart — no axes, no labels, just the shape.
 * Pure SVG, zero deps, draws an area + line in the brand color.
 */

type SparklineProps = {
  data: ReadonlyArray<number>;
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
};

export function Sparkline({
  data,
  width = 120,
  height = 36,
  stroke = "#FF5C2B",
  fill = "rgba(255, 92, 43, 0.18)",
  className = "",
}: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 0.0001);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((value, i) => {
    const x = i * stepX;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2.5}
          fill={stroke}
        />
      )}
    </svg>
  );
}
