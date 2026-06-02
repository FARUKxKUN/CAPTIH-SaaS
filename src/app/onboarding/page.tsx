"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAuth, IS_CLERK_CONFIGURED } from "@/lib/auth";
import { setupGsap, gsap, HOP_EASE, prefersReducedMotion } from "@/lib/motion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function OnboardingPage() {
  const { user } = useAuth();
  const sectionRef = useRef<HTMLElement | null>(null);
  const firstName =
    user?.firstName ||
    user?.email?.split("@")[0] ||
    "creator";

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: HOP_EASE } });
      tl.from('[data-hop="line"]', { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, 0)
        .from('[data-hop="step"]', { y: 16, opacity: 0, duration: 0.6, stagger: 0.1 }, 0.35)
        .from('[data-hop="cta"]', { y: 12, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.85);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-32 sm:px-10 sm:pt-40">
        <section ref={sectionRef} className="w-full max-w-3xl">
          <div className="text-center">
            <p
              data-hop="line"
              className="font-mono text-xs uppercase tracking-wider text-signal"
            >
              You&apos;re in.
            </p>
            <h1
              data-hop="line"
              className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl"
            >
              {IS_CLERK_CONFIGURED ? `Welcome, ${firstName}.` : "Welcome to Captih."}
            </h1>
            <p
              data-hop="line"
              className="mt-4 text-lg text-mute sm:text-xl"
            >
              You have <span className="text-bone">3 free minutes</span> waiting.
              Try Captih on a real Reel — see what Tunisian-trained AI can do
              with your voice.
            </p>
            <p data-hop="line" className="mt-3 text-sm text-mute">
              <span className="font-arabic text-base text-bone" dir="rtl">
                نحكي بالتونسي.
              </span>{" "}
              <span className="text-bone">We get it.</span>
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Step
              n="01"
              title="Drop"
              body="Any reel, podcast, or interview. MP4, MOV, MP3 — up to 30 minutes."
            />
            <Step
              n="02"
              title="Listen"
              body="Our model transcribes in ~3 minutes per audio hour."
            />
            <Step
              n="03"
              title="Use"
              body="Download .srt for CapCut or .txt for show notes. Edit inline if needed."
            />
          </div>

          <div className="mt-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <span data-hop="cta">
              <Link
                href="/transcribe"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-signal px-8 py-4 text-base font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
              >
                Transcribe my first file
                <span aria-hidden>→</span>
              </Link>
            </span>
            <span data-hop="cta">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface/40 px-8 py-4 text-base font-medium text-bone hover:border-mute"
              >
                Skip — go to dashboard
              </Link>
            </span>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div
      data-hop="step"
      className="rounded-2xl border border-line bg-surface/40 p-6 backdrop-blur"
    >
      <p className="font-mono text-xs text-signal">{n}</p>
      <h3 className="mt-2 font-display text-xl font-medium tracking-tight text-bone">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-mute">{body}</p>
    </div>
  );
}
