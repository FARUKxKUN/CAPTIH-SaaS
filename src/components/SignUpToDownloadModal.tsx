"use client";

import Link from "next/link";
import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  format: "srt" | "txt";
  redirectUrl: string; // where to return after successful sign-in/up
  onClose: () => void;
};

/**
 * Sign-up / sign-in gate that appears in-page (modal) when a signed-out user
 * tries to download. Replaces the previous "redirect to /sign-up" pattern with
 * a friction-light overlay that keeps the user's transcript visible behind it.
 *
 * In dev (no Clerk key), an extra "Skip — dev only" button lets you preview the
 * modal and continue testing the download flow.
 */
export function SignUpToDownloadModal({
  open,
  format,
  redirectUrl,
  onClose,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const signUpHref = `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface/95 p-8 shadow-2xl backdrop-blur">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-mute hover:bg-line hover:text-bone"
        >
          ✕
        </button>

        {/* Icon + saffron glow */}
        <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-signal/30 blur-2xl"
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-signal/15">
            <LockIcon className="h-7 w-7 text-signal" />
          </div>
        </div>

        <h2
          id="signup-modal-title"
          className="text-center font-display text-2xl font-medium tracking-tight text-bone"
        >
          One step before download
        </h2>
        <p className="mt-3 text-center text-sm text-mute">
          Create a free account to download your{" "}
          <span className="font-mono text-bone">.{format}</span>. It takes 10
          seconds — your transcript is waiting.
        </p>

        <ul className="mt-6 space-y-2 text-sm text-bone">
          <Bullet>3 free trial minutes on us</Bullet>
          <Bullet>Inline editor to fix typos</Bullet>
          <Bullet>Dashboard to track all your jobs</Bullet>
        </ul>

        <div className="mt-7 flex flex-col gap-2">
          <Link
            href={signUpHref}
            className="block w-full rounded-full bg-signal py-3 text-center text-sm font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
          >
            Create my account →
          </Link>
          <Link
            href={signInHref}
            className="block w-full rounded-full border border-line bg-ink py-3 text-center text-sm font-medium text-bone hover:border-mute"
          >
            I already have an account
          </Link>
        </div>

        <p className="mt-5 text-center text-[11px] text-mute">
          By continuing you agree to our{" "}
          <Link href="/legal/terms" className="link-metis text-bone">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="link-metis text-bone">
            Privacy Policy
          </Link>
          .
        </p>

      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-signal" />
      <span>{children}</span>
    </li>
  );
}

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}
