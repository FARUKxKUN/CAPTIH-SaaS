"use client";

import type { TranscribeJob } from "./transcribe";

/**
 * Client-side job storage for v1.
 * Persists completed jobs in localStorage so /result/[id] can be reopened
 * and the dashboard can show history before Supabase is wired in.
 *
 * When Supabase lands, only the producer/consumer swap to API calls — the
 * /result/[id] page consumes `getJob(id)` regardless of source.
 */

const STORAGE_KEY = "captih.jobs.v1";
const MAX_JOBS = 50;

function readAll(): TranscribeJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TranscribeJob[]) : [];
  } catch {
    return [];
  }
}

function writeAll(jobs: TranscribeJob[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, MAX_JOBS)));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function saveJob(job: TranscribeJob): void {
  const all = readAll();
  const filtered = all.filter((j) => j.id !== job.id);
  writeAll([job, ...filtered]);
}

export function getJob(id: string): TranscribeJob | null {
  return readAll().find((j) => j.id === id) ?? null;
}

export function listJobs(): TranscribeJob[] {
  return readAll();
}

export function deleteJob(id: string): void {
  writeAll(readAll().filter((j) => j.id !== id));
}

/**
 * Replace the segments of an existing job, regenerate the transcript, and persist.
 * Used by the editor's auto-save.
 */
export function updateJobSegments(
  id: string,
  segments: TranscribeJob["segments"]
): TranscribeJob | null {
  const all = readAll();
  const idx = all.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  const transcript = segments.map((s) => s.text).join("\n");
  const updated: TranscribeJob = { ...all[idx], segments, transcript };
  const next = [...all];
  next[idx] = updated;
  writeAll(next);
  return updated;
}
