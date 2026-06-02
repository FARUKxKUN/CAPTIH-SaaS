export function Mark({ className = "" }: { className?: string }) {
  // Stylized "c" as a sound bracket with a captured dot inside.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M19 5a9 9 0 1 0 0 14" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

type UnderlineProps = React.SVGProps<SVGSVGElement>;
export function Underline({ className = "", ...rest }: UnderlineProps) {
  return (
    <svg
      viewBox="0 0 300 12"
      preserveAspectRatio="none"
      fill="none"
      className={className}
      aria-hidden
      {...rest}
    >
      <path
        d="M2 8 Q 75 2, 150 6 T 298 5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Waveform({ className = "", bars = 28 }: { className?: string; bars?: number }) {
  return (
    <svg
      viewBox={`0 0 ${bars * 6} 40`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => {
        const h = 8 + Math.abs(Math.sin(i * 0.7) * 18) + Math.abs(Math.cos(i * 1.3) * 6);
        return (
          <rect
            key={i}
            x={i * 6 + 1}
            y={20 - h / 2}
            width={3}
            height={h}
            rx={1.5}
            fill="currentColor"
            opacity={0.4 + (i % 5) * 0.12}
          />
        );
      })}
    </svg>
  );
}
