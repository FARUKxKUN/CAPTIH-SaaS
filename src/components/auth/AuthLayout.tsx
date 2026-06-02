"use client";

import { Captih3DLogo } from "@/components/Captih3DLogo";
import type { ReactNode } from "react";

/**
 * Single-screen auth layout — fits a 720p+ viewport without scrolling.
 * Left: compact form column, vertically centered. Right: full-bleed 3D panel.
 */
export function AuthLayout({
  eyebrow = "Captih",
  title,
  subtitle,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main
      className="relative grid flex-1 grid-cols-1 lg:grid-cols-2"
      style={{ minHeight: "100dvh" }}
    >
      {/* LEFT — form column. Full-viewport height, content vertically centered.
          pt-24 below clears the fixed header (~72px) cleanly. No external footer. */}
      <section className="flex w-full flex-col justify-center px-8 pb-6 pt-24 sm:px-12 sm:pt-28 lg:px-14 lg:pb-8 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Headline block */}
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">
              {eyebrow}
            </p>
            <h1 className="mt-2.5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-bone sm:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2.5 max-w-md text-sm leading-relaxed text-mute sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {children}

          {/* Inline mini-credit — no external SiteFooter on auth pages */}
          <p className="mt-5 text-center text-[10px] text-mute">
            built by{" "}
            <a
              href="https://instagram.com/faruk_automates"
              target="_blank"
              rel="noopener noreferrer"
              className="link-metis text-bone"
            >
              Faruk
            </a>{" "}
            + <span className="text-bone">Yassine</span> · Tunis
          </p>
        </div>
      </section>

      {/* RIGHT — full-bleed 3D logo panel */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-gradient-to-br from-signal/20 via-signal/8 to-signal/3 lg:block"
      >
        {/* Soft inner glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255, 92, 43, 0.18), transparent 70%)",
          }}
        />

        {/* Decorative floating balls */}
        <FloatingBall className="left-[12%] top-[15%] h-5 w-5 opacity-50" />
        <FloatingBall className="right-[18%] top-[22%] h-3 w-3 opacity-40" delay="-2s" />
        <FloatingBall className="left-[20%] bottom-[20%] h-4 w-4 opacity-45" delay="-4s" />
        <FloatingBall className="right-[14%] bottom-[28%] h-6 w-6 opacity-30" delay="-1s" />
        <FloatingBall className="left-[45%] top-[10%] h-2.5 w-2.5 opacity-60" delay="-3s" />
        <FloatingBall className="right-[40%] bottom-[12%] h-3 w-3 opacity-50" delay="-5s" />

        {/* 3D logo fills the panel */}
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="h-full w-full max-w-xl">
            <Captih3DLogo />
          </div>
        </div>
      </aside>
    </main>
  );
}

function FloatingBall({
  className = "",
  delay = "0s",
}: {
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full bg-bone/60 shadow-lg ${className}`}
      style={{
        animation: "auth-float 6s ease-in-out infinite",
        animationDelay: delay,
      }}
    />
  );
}
