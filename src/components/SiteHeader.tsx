"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AuthGate, useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { setupGsap, gsap, prefersReducedMotion } from "@/lib/motion";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

/**
 * Fixed full-width header with Context-Aware Logo Animation (Codrops, Variant 1: Scale Down).
 * Logo shrinks to ~60% when any [data-collision] section enters the top band of the viewport,
 * returns to full size when no collision is detected.
 *
 * Auth controls swap based on Clerk session:
 *   - Signed out → "Sign in" + "Captiiiih →" (CTA goes to /transcribe for anonymous trial)
 *   - Signed in  → "Dashboard" + <UserButton /> (Clerk's account/sign-out menu)
 */
export function SiteHeader() {
  const logoRef = useRef<HTMLAnchorElement | null>(null);
  // Default to the signed-out view while Clerk loads, so the auth CTA is never blank.
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const logoEl = logoRef.current;
    if (!logoEl) return;
    setupGsap();
    if (prefersReducedMotion()) return;

    let overlapCount = 0;

    const hide = () =>
      gsap.to(logoEl, {
        scale: 0.6,
        duration: 0.5,
        ease: "power2.out",
        transformOrigin: "left center",
      });

    const show = () =>
      gsap.to(logoEl, {
        scale: 1,
        duration: 0.5,
        ease: "power2.out",
        transformOrigin: "left center",
      });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) overlapCount++;
          else overlapCount = Math.max(0, overlapCount - 1);
        });
        if (overlapCount > 0) hide();
        else show();
      },
      {
        rootMargin: "-30px 0px -88% 0px",
        threshold: 0,
      }
    );

    const targets = document.querySelectorAll("[data-collision]");
    targets.forEach((t) => observer.observe(t));

    return () => {
      targets.forEach((t) => observer.unobserve(t));
      observer.disconnect();
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/40 bg-ink/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full items-center justify-between px-6 py-3 sm:px-10 sm:py-4">
        <Link
          ref={logoRef}
          href="/"
          aria-label="Captih home"
          className="block leading-none will-change-transform"
          style={{ transformOrigin: "left center" }}
        >
          {/* Dark theme: transparent PNG with white wordmark */}
          <Image
            src="/captih-logo.png"
            alt="Captih"
            width={520}
            height={260}
            priority
            unoptimized
            className="theme-dark-only -my-6 h-20 w-auto select-none sm:-my-8 sm:h-24"
            style={{
              clipPath: "inset(28% 14% 30% 18%)",
              objectFit: "contain",
            }}
          />
          {/* Light theme: cream-bg PNG with dark wordmark — bg matches --c-ink */}
          <Image
            src="/captih-logo-light.png"
            alt="Captih"
            width={520}
            height={260}
            priority
            unoptimized
            className="theme-light-only -my-6 h-20 w-auto select-none sm:-my-8 sm:h-24"
            style={{
              clipPath: "inset(28% 14% 30% 18%)",
              objectFit: "contain",
            }}
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-mute md:flex">
          {COPY.nav.links.map((l) => (
            <Link key={l.href} href={l.href} className="link-metis text-mute">
              {l.label}
            </Link>
          ))}
          {/* Dashboard link only when signed in */}
          <AuthGate when="signed-in">
            <Link href="/dashboard" className="link-metis text-mute">
              Dashboard
            </Link>
          </AuthGate>
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme toggle — always visible */}
          <ThemeToggle />

          {isSignedIn ? (
            <>
              {/* Signed in: account dropdown + transcribe CTA */}
              <UserMenu />
              <Link
                href="/transcribe"
                className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
              >
                {COPY.nav.cta}
              </Link>
            </>
          ) : (
            <>
              {/* Signed out: sign-in link + sign-up CTA (this is the real entry point) */}
              <Link
                href="/sign-in"
                className="text-sm text-mute transition-colors hover:text-bone"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
              >
                Sign up free →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
