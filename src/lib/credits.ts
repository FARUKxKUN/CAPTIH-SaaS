"use client";

/**
 * Client-side credit balance shim for v1 (pre-auth).
 * Persists a single number (minutes remaining) in localStorage.
 * Free users start with 3 min lifetime credit.
 *
 * When Supabase + Dhmad lands, swap this for an API call that reads
 * the authenticated user's balance from the credits table. The consumer
 * shape stays: `getCreditsRemaining() => number`.
 */

const STORAGE_KEY = "captih.credits.v1";
const FREE_TRIAL_MINUTES = 3;

export function getCreditsRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // First-ever visit: seed with the free-trial allotment
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
    /* quota or private mode — ignore */
  }
}

export function addCredits(minutes: number): number {
  const next = getCreditsRemaining() + Math.max(0, Math.round(minutes));
  setCreditsRemaining(next);
  return next;
}

export function debitCredits(minutes: number): number {
  const next = Math.max(0, getCreditsRemaining() - Math.max(0, Math.round(minutes)));
  setCreditsRemaining(next);
  return next;
}
