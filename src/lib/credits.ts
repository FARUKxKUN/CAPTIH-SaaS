"use client";

/**
 * Client-side credit + pack-purchase shim for v1 (pre-auth).
 * Persists in localStorage. Replaced by Supabase + Dhmad webhook later.
 *
 * Two stores:
 *   1. captih.credits.v1  -> total minute balance (single integer)
 *   2. captih.packs.v1    -> array of PackPurchase records with expiry dates
 */

const STORAGE_KEY = "captih.credits.v1";
const PACKS_KEY = "captih.packs.v1";
const FREE_TRIAL_MINUTES = 3;

/** Default pack validity, kept in sync with copy.ts -> packsSub */
export const PACK_VALIDITY_DAYS = 30;

// ────────────────────────────────────────────────────────────────────────────
// Total balance (across all packs + free trial)
// ────────────────────────────────────────────────────────────────────────────

export function getCreditsRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, String(FREE_TRIAL_MINUTES));
      return FREE_TRIAL_MINUTES;
    }
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setCreditsRemaining(minutes: number): void {
  if (typeof window === "undefined") return;
  const safe = Math.max(0, Math.round(minutes));
  try {
    localStorage.setItem(STORAGE_KEY, String(safe));
  } catch {
    /* quota or private mode, ignore */
  }
}

export function addCredits(minutes: number): number {
  const next = getCreditsRemaining() + Math.max(0, Math.round(minutes));
  setCreditsRemaining(next);
  return next;
}

export function debitCredits(minutes: number): number {
  const next = Math.max(
    0,
    getCreditsRemaining() - Math.max(0, Math.round(minutes))
  );
  setCreditsRemaining(next);
  return next;
}

// ────────────────────────────────────────────────────────────────────────────
// Pack purchases (per-pack expiry tracking)
// ────────────────────────────────────────────────────────────────────────────

export type PackPurchase = {
  readonly id: string;
  readonly packId: string;
  readonly label: string;
  readonly minutes: number;
  readonly purchasedAt: string; // ISO
  readonly expiresAt: string; // ISO
};

function readPacks(): PackPurchase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PACKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PackPurchase[]) : [];
  } catch {
    return [];
  }
}

function writePacks(packs: PackPurchase[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PACKS_KEY, JSON.stringify(packs));
  } catch {
    /* quota, ignore */
  }
}

export function listPackPurchases(): PackPurchase[] {
  return readPacks();
}

export function addPackPurchase(input: {
  packId: string;
  label: string;
  minutes: number;
  validityDays?: number;
}): PackPurchase {
  const now = Date.now();
  const validityDays = input.validityDays ?? PACK_VALIDITY_DAYS;
  const pack: PackPurchase = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `pack-${now}-${Math.random().toString(36).slice(2, 8)}`,
    packId: input.packId,
    label: input.label,
    minutes: input.minutes,
    purchasedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + validityDays * 24 * 60 * 60 * 1000).toISOString(),
  };
  const all = readPacks();
  writePacks([pack, ...all]);
  addCredits(input.minutes);
  return pack;
}

export function removeExpiredPacks(): number {
  const now = Date.now();
  const all = readPacks();
  const live = all.filter((p) => new Date(p.expiresAt).getTime() > now);
  const expiredMinutes = all
    .filter((p) => new Date(p.expiresAt).getTime() <= now)
    .reduce((sum, p) => sum + p.minutes, 0);
  if (expiredMinutes > 0) {
    writePacks(live);
    debitCredits(expiredMinutes);
  }
  return expiredMinutes;
}

/**
 * Returns the soonest-expiring active pack, plus days remaining (rounded down).
 * Returns null if no packs are tracked.
 */
export function getNearestExpiry(): {
  pack: PackPurchase;
  daysRemaining: number;
  hoursRemaining: number;
  expired: boolean;
} | null {
  const packs = readPacks();
  if (packs.length === 0) return null;
  const now = Date.now();
  const sorted = [...packs].sort(
    (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
  );
  const next = sorted[0];
  const ms = new Date(next.expiresAt).getTime() - now;
  return {
    pack: next,
    daysRemaining: Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000))),
    hoursRemaining: Math.max(0, Math.floor(ms / (60 * 60 * 1000))),
    expired: ms <= 0,
  };
}
