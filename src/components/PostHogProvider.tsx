"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useAuth } from "@/lib/auth";

/**
 * PostHog analytics + session replay.
 *
 * - Initializes once on mount (only if NEXT_PUBLIC_POSTHOG_KEY is set, so it's
 *   a no-op when unconfigured — safe for local dev without a key).
 * - Captures pageviews manually on route change (App Router doesn't fire them).
 * - Identifies the signed-in Clerk user so events tie to a person.
 */

let initialized = false;

function initPostHog() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  // Skip if not configured or still the placeholder.
  if (!key || key.startsWith("phc_YOUR")) return;

  posthog.init(key, {
    api_host: host || "https://eu.i.posthog.com",
    capture_pageview: false, // we capture manually on route change
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      <PostHogIdentify />
      {children}
    </>
  );
}

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!initialized) return;
    let url = window.origin + pathname;
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

function PostHogIdentify() {
  const { isLoaded, isSignedIn, user } = useAuth();

  useEffect(() => {
    if (!initialized || !isLoaded) return;
    if (isSignedIn && user?.id) {
      posthog.identify(user.id, {
        email: user.email ?? undefined,
        name: user.fullName ?? user.firstName ?? undefined,
      });
    } else if (!isSignedIn) {
      // Signed out → stop tying events to the previous user.
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user?.id, user?.email, user?.fullName, user?.firstName]);

  return null;
}
