"use client";

import type { TranscribeJob } from "./transcribe";

/**
 * Job history — backed by Supabase via the /api/jobs endpoints.
 * Auth is carried by the sb-access-token cookie (sent automatically with
 * same-origin fetches), so these calls work for the signed-in user only.
 *
 * Functions are async (network-backed). The result page and dashboard await them.
 */

export async function listJobs(): Promise<TranscribeJob[]> {
  try {
    const res = await fetch("/api/jobs?limit=50", { credentials: "include" });
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs?: TranscribeJob[] };
    return data.jobs ?? [];
  } catch {
    return [];
  }
}

export async function getJob(id: string): Promise<TranscribeJob | null> {
  try {
    const res = await fetch(`/api/jobs/${id}`, { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { job?: TranscribeJob };
    return data.job ?? null;
  } catch {
    return null;
  }
}

export async function deleteJob(id: string): Promise<void> {
  try {
    await fetch(`/api/jobs/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Replace the segments of a job (editor auto-save) and persist to Supabase.
 */
export async function updateJobSegments(
  id: string,
  segments: TranscribeJob["segments"]
): Promise<TranscribeJob | null> {
  try {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segments }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { job?: TranscribeJob };
    return data.job ?? null;
  } catch {
    return null;
  }
}
