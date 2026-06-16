"use client";

import posthog from "posthog-js";

/**
 * Thin typed wrapper over PostHog capture. No-ops if PostHog isn't initialized
 * (e.g. no key configured), so call sites never need to guard.
 *
 * Keep event names stable — they become funnel/retention keys in PostHog.
 */
type CaptihEvent =
  | "transcribe_started"
  | "transcribe_completed"
  | "transcribe_failed"
  | "out_of_credits"
  | "download_clicked"
  | "topup_clicked";

export function track(
  event: CaptihEvent,
  props?: Record<string, unknown>
): void {
  try {
    if (typeof window === "undefined") return;
    // posthog.capture is safe to call even before init in recent versions,
    // but guard on __loaded to avoid queuing when unconfigured.
    if (!posthog.__loaded) return;
    posthog.capture(event, props);
  } catch {
    /* analytics must never break the app */
  }
}
