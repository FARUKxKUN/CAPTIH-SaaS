"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type TranscribeJob } from "@/lib/transcribe";
import { listJobs, deleteJob } from "@/lib/jobStorage";
import { getCreditsRemaining } from "@/lib/credits";
import {
  computeStats,
  dailyUsage,
  filesPerDay,
  formatBreakdown,
  monthlyGoals,
  trendSeries,
  type Period,
} from "@/lib/stats";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StatCard } from "@/components/dashboard/StatCard";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { FormatDonut } from "@/components/dashboard/FormatDonut";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { MiniBars } from "@/components/dashboard/MiniBars";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { TranscriptCard } from "@/components/dashboard/TranscriptCard";

const PERIOD_OPTIONS: ReadonlyArray<{ label: string; value: Period }> = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "All", value: "all" },
];

const TOTAL_TRIAL_MINUTES = 3;

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const justWelcomed = searchParams.get("welcome") === "true";

  const { user } = useAuth();
  const greetingName =
    user?.firstName || user?.email?.split("@")[0] || "creator";

  const [jobs, setJobs] = useState<TranscribeJob[] | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [period, setPeriod] = useState<Period>("week");
  const [showWelcome, setShowWelcome] = useState<boolean>(justWelcomed);

  useEffect(() => {
    setJobs(listJobs());
    setCredits(getCreditsRemaining());
  }, []);

  useEffect(() => {
    if (!justWelcomed) return;
    const t = setTimeout(() => setShowWelcome(false), 6000);
    return () => clearTimeout(t);
  }, [justWelcomed]);

  const stats = useMemo(
    () => (jobs ? computeStats(jobs, period) : null),
    [jobs, period]
  );
  const usage = useMemo(
    () => (jobs ? dailyUsage(jobs, period === "month" ? 30 : 14) : []),
    [jobs, period]
  );
  const activity = useMemo(
    () => (jobs ? dailyUsage(jobs, 30) : []),
    [jobs]
  );
  const formats = useMemo(
    () => (jobs ? formatBreakdown(jobs) : { audio: 0, video: 0 }),
    [jobs]
  );
  const trend14 = useMemo(() => (jobs ? trendSeries(jobs, 14) : []), [jobs]);
  const files7 = useMemo(() => (jobs ? filesPerDay(jobs, 7) : []), [jobs]);
  const goals = useMemo(() => (jobs ? monthlyGoals(jobs) : []), [jobs]);

  const handleDelete = (id: string) => {
    deleteJob(id);
    setJobs(listJobs());
  };

  const isLoading = jobs === null;
  const isEmpty = jobs !== null && jobs.length === 0;
  const lowCredits = credits <= 3;

  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col px-6 pb-24 pt-32 sm:px-10 sm:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          {showWelcome && <WelcomeBanner onDismiss={() => setShowWelcome(false)} />}

          <DashboardHeader
            credits={credits}
            greetingName={greetingName}
            period={period}
            onPeriodChange={setPeriod}
          />

          {lowCredits && !showWelcome && !isLoading && <TopUpBanner credits={credits} />}

          {isLoading && <LoadingState />}

          {!isLoading && (
            <>
              {stats && (
                <StatsGrid
                  stats={stats}
                  credits={credits}
                  period={period}
                  trend14={trend14}
                  files7={files7}
                />
              )}

              <ChartsRow usage={usage} formats={formats} />

              <SecondaryRow activity={activity} goals={goals} />

              {isEmpty ? (
                <EmptyState />
              ) : (
                jobs && <RecentTranscripts jobs={jobs} onDelete={handleDelete} />
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Welcome banner — appears once after sign-up + first download
// ────────────────────────────────────────────────────────────────────────────

function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-ok/30 bg-ok/5 px-5 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ok/15 text-lg text-ok">
          ✓
        </span>
        <div>
          <p className="font-display text-sm font-medium text-bone">
            Welcome — your account is live.
          </p>
          <p className="mt-0.5 text-xs text-mute">
            Your transcript downloaded automatically. Track everything from here.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-mute hover:text-bone"
        aria-label="Dismiss welcome banner"
      >
        Dismiss
      </button>
    </div>
  );
}

function TopUpBanner({ credits }: { credits: number }) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-signal/30 bg-gradient-to-r from-signal/10 to-signal/5 px-5 py-4 backdrop-blur sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-signal/15 text-lg text-signal">
          ⚡
        </span>
        <div>
          <p className="font-display text-sm font-medium text-bone">
            {credits === 0
              ? "You're out of minutes."
              : `Only ${credits} minute${credits === 1 ? "" : "s"} left.`}
          </p>
          <p className="mt-0.5 text-xs text-mute">
            Top up a pack to keep transcribing — starting from 5 DT.
          </p>
        </div>
      </div>
      <Link
        href="/#pricing"
        className="rounded-full bg-signal px-5 py-2 text-xs font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
      >
        See packs →
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Header — greeting + period selector + CTAs
// ────────────────────────────────────────────────────────────────────────────

function DashboardHeader({
  credits: _credits,
  greetingName,
  period,
  onPeriodChange,
}: {
  credits: number;
  greetingName: string;
  period: Period;
  onPeriodChange: (p: Period) => void;
}) {
  return (
    <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-signal">
          Dashboard
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-bone sm:text-4xl">
          Hey {greetingName} 👋
        </h1>
        <p className="mt-2 text-sm text-mute">
          Your captih activity at a glance.
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <PeriodSelector period={period} onChange={onPeriodChange} />
        <Link
          href="/#pricing"
          className="rounded-full border border-line bg-ink px-5 py-2.5 text-center text-sm font-medium text-bone hover:border-mute"
        >
          Top up
        </Link>
        <Link
          href="/transcribe"
          className="rounded-full bg-signal px-5 py-2.5 text-center text-sm font-medium text-ink transition-transform duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5"
        >
          New transcription →
        </Link>
      </div>
    </div>
  );
}

function PeriodSelector({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-surface/40 p-1">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
            period === opt.value
              ? "bg-signal text-ink"
              : "text-mute hover:text-bone"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stats grid — 4 KPI cards with inline mini-visualizations
// ────────────────────────────────────────────────────────────────────────────

function StatsGrid({
  stats,
  credits,
  period,
  trend14,
  files7,
}: {
  stats: ReturnType<typeof computeStats>;
  credits: number;
  period: Period;
  trend14: number[];
  files7: number[];
}) {
  const periodLabel =
    period === "week" ? "last week" : period === "month" ? "last month" : "ever";

  const minutesDir =
    stats.trend.minutesPct > 0
      ? "up"
      : stats.trend.minutesPct < 0
        ? "down"
        : "flat";
  const filesDir =
    stats.trend.filesPct > 0 ? "up" : stats.trend.filesPct < 0 ? "down" : "flat";

  const balanceRatio = Math.min(1, credits / TOTAL_TRIAL_MINUTES);
  const balanceLabel = credits === 1 ? "min" : "min";

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatCard
        label="Balance"
        value={credits}
        unit={balanceLabel}
        hint="Remaining transcription time"
        highlight
        viz={
          <CircularProgress value={balanceRatio} size={48} stroke={4}>
            <span className="text-[9px]">
              {Math.round(balanceRatio * 100)}%
            </span>
          </CircularProgress>
        }
      />
      <StatCard
        label="Transcribed"
        value={stats.minutesUsed}
        unit="min"
        trend={
          period === "all"
            ? undefined
            : {
                pct: stats.trend.minutesPct,
                direction: minutesDir,
                period: periodLabel,
              }
        }
        hint={`Across ${stats.totalFiles} file${stats.totalFiles === 1 ? "" : "s"}`}
        viz={<Sparkline data={trend14} width={90} height={32} />}
      />
      <StatCard
        label="Files"
        value={stats.totalFiles}
        trend={
          period === "all"
            ? undefined
            : {
                pct: stats.trend.filesPct,
                direction: filesDir,
                period: periodLabel,
              }
        }
        hint={
          stats.totalFiles === 0
            ? "Drop your first one"
            : `Avg ${stats.avgMinutesPerFile} min each`
        }
        viz={<MiniBars data={files7} width={80} height={32} />}
      />
      <StatCard
        label="Time saved"
        value={stats.timeSavedMinutes}
        unit="min"
        hint="vs manual typing"
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Charts row — usage over time + format breakdown
// ────────────────────────────────────────────────────────────────────────────

function ChartsRow({
  usage,
  formats,
}: {
  usage: ReturnType<typeof dailyUsage>;
  formats: ReturnType<typeof formatBreakdown>;
}) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <UsageChart data={[...usage]} />
      <FormatDonut breakdown={formats} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Secondary row — activity heatmap + monthly goals
// ────────────────────────────────────────────────────────────────────────────

function SecondaryRow({
  activity,
  goals,
}: {
  activity: ReturnType<typeof dailyUsage>;
  goals: ReturnType<typeof monthlyGoals>;
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <ActivityHeatmap data={[...activity]} />
      <GoalsProgress goals={[...goals]} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Recent transcripts — card grid instead of table
// ────────────────────────────────────────────────────────────────────────────

function RecentTranscripts({
  jobs,
  onDelete,
}: {
  jobs: TranscribeJob[];
  onDelete: (id: string) => void;
}) {
  const recent = jobs.slice(0, 6);
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-sm font-medium uppercase tracking-wider text-mute">
          Recent transcriptions
        </h2>
        <span className="font-mono text-xs text-mute">
          {jobs.length} job{jobs.length === 1 ? "" : "s"} · showing {recent.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((job) => (
          <TranscriptCard key={job.id} job={job} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Empty / loading
// ────────────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="rounded-3xl border border-line bg-surface/60 p-10 text-center backdrop-blur">
      <p className="font-mono text-xs text-mute">Loading your jobs…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <Link
      href="/transcribe"
      className="group flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-line bg-surface/30 px-6 py-16 text-center transition-all duration-200 ease-[var(--ease-spring)] hover:border-signal hover:bg-surface/50"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-signal/20 blur-2xl group-hover:bg-signal/40" />
        <svg
          viewBox="0 0 24 24"
          className="relative h-12 w-12 text-signal"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
          <path d="M5 21h14" />
        </svg>
      </div>
      <div>
        <p className="font-display text-lg font-medium text-bone">
          Drop your first file
        </p>
        <p className="mt-1 font-mono text-xs text-mute">
          Stats and recent transcriptions will appear here
        </p>
      </div>
    </Link>
  );
}
