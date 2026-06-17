"use client";

import Link from "next/link";

/**
 * Segmented Sign In / Sign up toggle above the Clerk form — recreates the
 * tabbed control from the original auth design. Each tab links to its route.
 */
export function AuthTabs({ active }: { active: "sign-in" | "sign-up" }) {
  const base =
    "flex-1 rounded-xl py-2.5 text-center text-sm font-medium transition-colors";
  const on = "bg-surface text-bone shadow-sm";
  const off = "text-mute hover:text-bone";

  return (
    <div className="mb-5 flex gap-1 rounded-2xl border border-line bg-ink/40 p-1">
      <Link
        href="/sign-in"
        aria-current={active === "sign-in" ? "page" : undefined}
        className={`${base} ${active === "sign-in" ? on : off}`}
      >
        Sign In
      </Link>
      <Link
        href="/sign-up"
        aria-current={active === "sign-up" ? "page" : undefined}
        className={`${base} ${active === "sign-up" ? on : off}`}
      >
        Sign up
      </Link>
    </div>
  );
}
