"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";

/**
 * Replaces Clerk's <UserButton/>. Renders an avatar (initial in saffron) that
 * opens a small dropdown with email, dashboard link, and sign-out.
 */
export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial =
    (user?.firstName?.[0] || user?.email?.[0] || "C").toUpperCase();
  const label =
    user?.firstName || user?.fullName || user?.email?.split("@")[0] || "Captih";

  const handleSignOut = () => {
    signOut();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-signal/15 font-display text-sm font-medium text-signal ring-2 ring-line transition-all hover:ring-signal"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-2xl backdrop-blur"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate font-display text-sm font-medium text-bone">
              {label}
            </p>
            {user?.email && (
              <p className="mt-0.5 truncate font-mono text-[11px] text-mute">
                {user.email}
              </p>
            )}
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-bone hover:bg-ink/40"
            role="menuitem"
          >
            Dashboard
          </Link>
          <Link
            href="/transcribe"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-bone hover:bg-ink/40"
            role="menuitem"
          >
            New transcription
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full border-t border-line px-4 py-2.5 text-left text-sm text-mute hover:bg-ink/40 hover:text-signal"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
