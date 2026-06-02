"use client";

import { useTheme } from "./ThemeProvider";

/**
 * Sun/moon toggle button. Sits in the SiteHeader next to the auth controls.
 * The icons cross-fade + rotate when toggled.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface/40 text-mute transition-colors hover:border-mute hover:text-bone"
    >
      <span className="sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
      <SunIcon
        className={`absolute h-4 w-4 transition-all duration-300 ease-[var(--ease-spring)] ${
          isDark
            ? "scale-0 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100 text-signal"
        }`}
      />
      <MoonIcon
        className={`absolute h-4 w-4 transition-all duration-300 ease-[var(--ease-spring)] ${
          isDark
            ? "scale-100 rotate-0 opacity-100 text-signal"
            : "scale-0 -rotate-90 opacity-0"
        }`}
      />
    </button>
  );
}

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
