import type { TranscribeJob } from "./transcribe";

/**
 * Stats derived from completed transcribe jobs.
 * In v1 the source is localStorage (jobStorage.listJobs()).
 * When Supabase lands, swap the source — this module's shape is stable.
 */

export type Period = "week" | "month" | "all";

export type StatsSummary = {
  readonly minutesUsed: number;
  readonly totalFiles: number;
  readonly avgMinutesPerFile: number;
  readonly timeSavedMinutes: number; // assume manual typing is ~4× audio duration
  readonly trend: { readonly minutesPct: number; readonly filesPct: number };
};

export type DailyUsagePoint = {
  readonly date: string; // YYYY-MM-DD
  readonly minutes: number;
  readonly files: number;
  readonly label: string; // short display: "Mon 06"
};

export type FormatBreakdown = {
  readonly audio: number;
  readonly video: number;
};

// ────────────────────────────────────────────────────────────────────────────
// Filters
// ────────────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function periodCutoff(period: Period): number {
  const now = Date.now();
  if (period === "week") return now - 7 * DAY_MS;
  if (period === "month") return now - 30 * DAY_MS;
  return 0;
}

function filterByPeriod(jobs: readonly TranscribeJob[], period: Period): TranscribeJob[] {
  if (period === "all") return [...jobs];
  const cutoff = periodCutoff(period);
  return jobs.filter((j) => new Date(j.createdAt).getTime() >= cutoff);
}

function previousWindow(jobs: readonly TranscribeJob[], period: Period): TranscribeJob[] {
  if (period === "all") return [];
  const span = period === "week" ? 7 * DAY_MS : 30 * DAY_MS;
  const end = Date.now() - span;
  const start = end - span;
  return jobs.filter((j) => {
    const t = new Date(j.createdAt).getTime();
    return t >= start && t < end;
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Summary metrics — KPI cards
// ────────────────────────────────────────────────────────────────────────────

function pctChange(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export function computeStats(
  jobs: readonly TranscribeJob[],
  period: Period = "week"
): StatsSummary {
  const current = filterByPeriod(jobs, period);
  const prior = previousWindow(jobs, period);

  const minutesUsed = Math.round(
    current.reduce((sum, j) => sum + j.durationSec, 0) / 60
  );
  const totalFiles = current.length;
  const avgMinutesPerFile =
    totalFiles === 0 ? 0 : Math.round((minutesUsed / totalFiles) * 10) / 10;

  // Time-saved heuristic — manual subtitling is ~4× the audio length in active typing time
  const timeSavedMinutes = Math.round(
    current.reduce((sum, j) => sum + j.durationSec * 4, 0) / 60
  );

  const priorMinutes = Math.round(
    prior.reduce((sum, j) => sum + j.durationSec, 0) / 60
  );
  const priorFiles = prior.length;

  return {
    minutesUsed,
    totalFiles,
    avgMinutesPerFile,
    timeSavedMinutes,
    trend: {
      minutesPct: pctChange(minutesUsed, priorMinutes),
      filesPct: pctChange(totalFiles, priorFiles),
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Time series — usage bar chart
// ────────────────────────────────────────────────────────────────────────────

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shortLabel(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  return `${WEEKDAY[d.getDay()]} ${dd}`;
}

export function dailyUsage(
  jobs: readonly TranscribeJob[],
  days = 14
): DailyUsagePoint[] {
  const buckets = new Map<string, { minutes: number; files: number }>();

  // Seed empty buckets so the chart shows zero-days too
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    buckets.set(isoDate(d), { minutes: 0, files: 0 });
  }

  for (const job of jobs) {
    const key = isoDate(new Date(job.createdAt));
    const slot = buckets.get(key);
    if (!slot) continue; // outside window
    slot.minutes += job.durationSec / 60;
    slot.files += 1;
  }

  return Array.from(buckets.entries()).map(([date, { minutes, files }]) => ({
    date,
    minutes: Math.round(minutes * 10) / 10,
    files,
    label: shortLabel(new Date(date)),
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// Format breakdown — donut chart
// ────────────────────────────────────────────────────────────────────────────

const VIDEO_EXTS = [".mp4", ".mov", ".webm", ".avi", ".mkv"];

function isVideo(filename: string): boolean {
  const lower = filename.toLowerCase();
  return VIDEO_EXTS.some((ext) => lower.endsWith(ext));
}

export function formatBreakdown(jobs: readonly TranscribeJob[]): FormatBreakdown {
  let video = 0;
  let audio = 0;
  for (const job of jobs) {
    if (isVideo(job.filename)) video++;
    else audio++;
  }
  return { video, audio };
}

// ────────────────────────────────────────────────────────────────────────────
// Inline KPI series — small data for sparklines + mini-bars on KPI cards
// ────────────────────────────────────────────────────────────────────────────

/** Last N days of cumulative minutes used — for sparkline trend. */
export function trendSeries(
  jobs: readonly TranscribeJob[],
  days = 14
): number[] {
  return dailyUsage(jobs, days).map((d) => d.minutes);
}

/** Last 7 days of file counts — for mini-bars on the "Files" KPI. */
export function filesPerDay(jobs: readonly TranscribeJob[], days = 7): number[] {
  return dailyUsage(jobs, days).map((d) => d.files);
}

// ────────────────────────────────────────────────────────────────────────────
// Goals — soft monthly targets derived from current activity
// ────────────────────────────────────────────────────────────────────────────

export type GoalProgress = {
  readonly key: string;
  readonly label: string;
  readonly current: number;
  readonly target: number;
  readonly unit: string;
};

export function monthlyGoals(jobs: readonly TranscribeJob[]): GoalProgress[] {
  const monthAgo = Date.now() - 30 * DAY_MS;
  const recent = jobs.filter(
    (j) => new Date(j.createdAt).getTime() >= monthAgo
  );

  const filesThisMonth = recent.length;
  const minutesThisMonth = Math.round(
    recent.reduce((s, j) => s + j.durationSec, 0) / 60
  );
  const editsThisMonth = recent.reduce(
    (s, j) =>
      s + (j.segments.length > 0 && j.transcript.length > 0 ? 1 : 0),
    0
  );

  return [
    {
      key: "files",
      label: "Files transcribed",
      current: filesThisMonth,
      target: 10,
      unit: "files",
    },
    {
      key: "minutes",
      label: "Total minutes",
      current: minutesThisMonth,
      target: 60,
      unit: "min",
    },
    {
      key: "edited",
      label: "Polished transcripts",
      current: editsThisMonth,
      target: Math.max(3, filesThisMonth),
      unit: "files",
    },
  ];
}
