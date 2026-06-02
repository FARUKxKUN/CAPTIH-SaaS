"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";
import { COPY } from "@/lib/copy";
import { RevealText } from "./motion/RevealText";

export function PricingSection() {
  return (
    <section id="pricing" data-collision aria-labelledby="pricing-heading" className="relative">
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-12 sm:px-10 sm:pt-32 sm:pb-16">
        <p className="font-mono text-xs uppercase tracking-wider text-signal">
          {COPY.pricing.eyebrow}
        </p>
        <RevealText
          as="h2"
          id="pricing-heading"
          className="mt-3 max-w-3xl font-display text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl md:text-6xl"
        >
          {COPY.pricing.headline}
        </RevealText>
        <p className="mt-4 max-w-xl text-base text-mute sm:text-lg">{COPY.pricing.sub}</p>
      </div>

      <FreeBanner />

      <PacksGrid />

      <CustomBuyHours />
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Free banner — slim entry point, no card required
// ────────────────────────────────────────────────────────────────────────────

function FreeBanner() {
  const f = COPY.pricing.free;
  return (
    <div className="mx-auto mb-6 max-w-6xl px-6 sm:px-10">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-surface/30 px-6 py-5 backdrop-blur sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ok/10 font-mono text-xs font-medium text-ok">
            FREE
          </span>
          <div>
            <p className="font-display text-base font-medium text-bone sm:text-lg">
              {f.headline}
            </p>
            <p className="mt-0.5 text-xs text-mute sm:text-sm">{f.sub}</p>
          </div>
        </div>
        <Link
          href="/transcribe"
          className="rounded-full border border-line bg-ink px-5 py-2.5 text-center text-sm font-medium text-bone transition-all duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-mute"
        >
          {f.cta}
        </Link>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Packs grid — 4 one-time packs, the main pricing story
// ────────────────────────────────────────────────────────────────────────────

function PacksGrid() {
  return (
    <div className="mx-auto max-w-6xl px-6 sm:px-10">
      <div className="mb-5 flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-mute">
          {COPY.pricing.packsLabel}
        </p>
        <p className="font-mono text-xs text-mute">{COPY.pricing.packsSub}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COPY.pricing.packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} />
        ))}
      </div>
    </div>
  );
}

type Pack = (typeof COPY.pricing.packs)[number];

function PackCard({ pack }: { pack: Pack }) {
  const { minutes, priceDT, ratePerMin, line, cta, highlight } = pack;
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-transform duration-300 ease-[var(--ease-spring)] hover:-translate-y-1 ${
        highlight
          ? "border-signal/40 bg-gradient-to-b from-signal/10 to-surface/60"
          : "border-line bg-surface/40"
      }`}
    >
      {highlight && (
        <span className="absolute right-5 top-5 rounded-full bg-signal px-2 py-0.5 text-[10px] font-medium text-ink">
          POPULAR
        </span>
      )}

      <div>
        <h3 className="font-display text-xl font-medium tracking-tight text-bone">
          {formatMinutes(minutes)}
        </h3>
        <p className="mt-1 text-xs text-mute">{line}</p>
      </div>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-4xl font-medium text-bone">{priceDT}</span>
        <span className="text-sm text-mute">DT</span>
      </div>
      <p className="mt-1 font-mono text-[11px] text-mute">
        {ratePerMin.toFixed(2)} DT / min
      </p>

      <ul className="mt-6 space-y-2 text-xs text-bone">
        {COPY.pricing.packFeatures.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-signal" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex-1" />

      <Link
        href={`/transcribe?pack=${pack.id}`}
        className={`block rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5 ${
          highlight
            ? "bg-signal text-ink hover:bg-signal/90"
            : "border border-line bg-ink text-bone hover:border-mute"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Custom buy hours — number input, live tiered price, 30-day expiry
// ────────────────────────────────────────────────────────────────────────────

function rateForMinutes(minutes: number): { rate: number; label: string } {
  for (const tier of COPY.pricing.custom.tiers) {
    if (minutes <= tier.upTo) return { rate: tier.ratePerMin, label: tier.label };
  }
  const last = COPY.pricing.custom.tiers[COPY.pricing.custom.tiers.length - 1];
  return { rate: last.ratePerMin, label: last.label };
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hour${h > 1 ? "s" : ""}`;
  return `${h}h ${m}m`;
}

function clampMinutes(value: number): number {
  const { min, max } = COPY.pricing.custom.input;
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function CustomBuyHours() {
  const c = COPY.pricing.custom;
  const [minutes, setMinutes] = useState<number>(c.input.default);
  const [raw, setRaw] = useState<string>(String(c.input.default));

  const { rate, label } = useMemo(() => rateForMinutes(minutes), [minutes]);
  const total = useMemo(() => Math.round(minutes * rate * 100) / 100, [minutes, rate]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRaw(value);
    if (value === "") return;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) setMinutes(clampMinutes(parsed));
  };

  const onBlur = () => {
    const clamped = clampMinutes(Number(raw));
    setMinutes(clamped);
    setRaw(String(clamped));
  };

  return (
    <div className="mx-auto mt-16 max-w-6xl px-6 sm:px-10">
      <div className="rounded-2xl border border-line bg-surface/40 p-8 backdrop-blur sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-wider text-signal">
              {c.eyebrow}
            </p>
            <h3 className="mt-2 font-display text-2xl font-medium tracking-tight text-bone sm:text-3xl">
              {c.headline}
            </h3>
            <p className="mt-3 text-sm text-mute sm:text-base">{c.sub}</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr] md:gap-10">
          {/* Input column */}
          <div className="flex flex-col">
            <label
              htmlFor="custom-minutes"
              className="font-mono text-xs uppercase tracking-wider text-mute"
            >
              Minutes ({c.input.min}–{c.input.max})
            </label>
            <div className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-line bg-ink/60 focus-within:border-signal">
              <input
                id="custom-minutes"
                type="number"
                inputMode="numeric"
                min={c.input.min}
                max={c.input.max}
                step={c.input.step}
                value={raw}
                onChange={onChange}
                onBlur={onBlur}
                className="flex-1 bg-transparent px-5 py-4 font-display text-3xl font-medium text-bone outline-none placeholder:text-mute/40 sm:text-4xl"
                placeholder={String(c.input.default)}
                aria-describedby="custom-minutes-help"
              />
              <span className="flex items-center px-5 font-mono text-xs uppercase tracking-wider text-mute">
                min
              </span>
            </div>
            <p id="custom-minutes-help" className="mt-3 text-xs text-mute">
              That's <span className="text-bone">{formatMinutes(minutes)}</span>. Tier:{" "}
              <span className="text-bone">{label}</span>. {c.footnote}
            </p>

            <div className="mt-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-mute">
                Volume tiers
              </p>
              <ul className="space-y-1.5 text-xs">
                {c.tiers.map((tier) => {
                  const active = label === tier.label;
                  return (
                    <li
                      key={tier.label}
                      className={`flex items-center justify-between rounded-md px-3 py-2 font-mono ${
                        active
                          ? "bg-signal/10 text-signal"
                          : "bg-ink/40 text-mute"
                      }`}
                    >
                      <span>{tier.label}</span>
                      <span>{tier.ratePerMin.toFixed(2)} DT / min</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Price column */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-gradient-to-br from-signal/10 via-surface/50 to-ink p-6 sm:p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-mute">You pay</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-5xl font-medium text-signal sm:text-6xl">
                  {total}
                </span>
                <span className="text-lg text-bone">DT</span>
              </div>
              <p className="mt-2 font-mono text-xs text-mute">
                at {rate.toFixed(2)} DT / minute · {formatMinutes(minutes)} of audio
              </p>
            </div>

            <Link
              href={`/transcribe?custom=${minutes}`}
              className="mt-8 block rounded-full bg-signal px-6 py-3 text-center text-sm font-medium text-ink transition-all duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
            >
              {c.cta} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
