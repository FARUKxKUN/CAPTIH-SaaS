"use client";

/**
 * Circular progress ring. Used inside KPI cards for "X of Y" style ratios.
 * Pure SVG, zero deps.
 */

type CircularProgressProps = {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  fg?: string;
  bg?: string;
  className?: string;
  children?: React.ReactNode;
};

export function CircularProgress({
  value,
  size = 56,
  stroke = 5,
  fg = "#FF5C2B",
  bg = "#1E1E26",
  className = "",
  children,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={bg}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={fg}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-bone">
          {children}
        </div>
      )}
    </div>
  );
}
