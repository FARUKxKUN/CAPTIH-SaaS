"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNearestExpiry, type PackPurchase } from "@/lib/credits";

type Tier = "info" | "warn" | "urgent" | "expired";

type State = {
  pack: PackPurchase;
  daysRemaining: number;
  hoursRemaining: number;
  expired: boolean;
};

/**
 * Soft urgency banner for the soonest-expiring pack.
 * Color + tone escalate as the clock runs out.
 *
 * Tiers:
 *   info    (14-8 days):  mute color, low-pressure FYI
 *   warn    (7-4 days):   saffron tint, "soon" framing
 *   urgent  (3-1 days):   stronger saffron, action-forward
 *   expired (0 / past):   "expired" badge, top-up CTA
 */
export function ExpiryBanner() {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    setState(getNearestExpiry());
  }, []);

  // Only render when there's an active pack tracked
  if (!state) return null;

  // Don't bother surfacing more than 14 days out (it's not urgent yet)
  if (!state.expired && state.daysRemaining > 14) return null;

  const tier: Tier = state.expired
    ? "expired"
    : state.daysRemaining <= 3
      ? "urgent"
      : state.daysRemaining <= 7
        ? "warn"
        : "info";

  const cfg = TIER_CONFIG[tier];

  return (
    <div
      className={`mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border px-5 py-4 backdrop-blur sm:flex-row sm:items-center ${cfg.wrapper}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base ${cfg.iconWrap}`}
        >
          {cfg.icon}
        </span>
        <div>
          <p className="font-display text-sm font-medium text-bone">
            {tier === "expired"
              ? `${state.pack.label} expired.`
              : labelFor(tier, state)}
          </p>
          <p className="mt-0.5 text-xs text-mute">
            {tier === "expired"
              ? "Top up to keep transcribing - new packs run 30 days."
              : `${state.pack.minutes} min pack purchased ${formatPurchaseDate(state.pack.purchasedAt)}. Use them before they reset.`}
          </p>
        </div>
      </div>
      <Link
        href="/pricing"
        className={`rounded-full px-5 py-2 text-xs font-medium transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5 ${cfg.cta}`}
      >
        {tier === "expired" ? "Buy another pack" : "Top up"} -&gt;
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  Tier,
  {
    wrapper: string;
    iconWrap: string;
    cta: string;
    icon: string;
  }
> = {
  info: {
    wrapper: "border-line bg-surface/40",
    iconWrap: "bg-mute/15 text-mute",
    cta: "border border-line bg-ink text-bone hover:border-mute",
    icon: "i",
  },
  warn: {
    wrapper: "border-signal/30 bg-gradient-to-r from-signal/8 to-signal/3",
    iconWrap: "bg-signal/15 text-signal",
    cta: "bg-signal/90 text-ink hover:bg-signal",
    icon: "!",
  },
  urgent: {
    wrapper: "border-signal/50 bg-gradient-to-r from-signal/15 to-signal/5",
    iconWrap: "bg-signal/20 text-signal",
    cta: "bg-signal text-ink hover:-translate-y-0.5",
    icon: "!",
  },
  expired: {
    wrapper: "border-line bg-surface/40 opacity-90",
    iconWrap: "bg-mute/20 text-mute",
    cta: "bg-signal text-ink hover:-translate-y-0.5",
    icon: "x",
  },
};

function labelFor(tier: Tier, state: State): string {
  const { daysRemaining, hoursRemaining, pack } = state;
  if (tier === "info") {
    return `${daysRemaining} days left on your ${pack.minutes} min pack.`;
  }
  if (tier === "warn") {
    return `Only ${daysRemaining} days left on your ${pack.minutes} min pack.`;
  }
  if (tier === "urgent") {
    if (daysRemaining === 0) {
      return `${hoursRemaining}h left on your ${pack.minutes} min pack. Use it today.`;
    }
    if (daysRemaining === 1) {
      return `Last day for your ${pack.minutes} min pack. Use it now.`;
    }
    return `${daysRemaining} days left on your ${pack.minutes} min pack. Time to use them.`;
  }
  return `${pack.minutes} min pack expired.`;
}

function formatPurchaseDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
