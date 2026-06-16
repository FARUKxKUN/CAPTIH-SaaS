import { getSupabaseServerClient } from "./supabase-server";
import { type TranscribeJob, type SrtSegment, segmentsToTxt } from "./transcribe";

/**
 * Map a raw DB job row into the TranscribeJob shape the frontend consumes
 * (dashboard, /result/[id], editor). Segments live in transcript_json.
 */
export function jobRowToTranscribeJob(row: Record<string, unknown>): TranscribeJob {
  // transcript_json is either the new { words, captions } shape or, for older
  // jobs, a plain SrtSegment[] array. Handle both.
  const tj = row.transcript_json as
    | { words?: SrtSegment[]; captions?: SrtSegment[] }
    | SrtSegment[]
    | null;

  let segments: SrtSegment[] = [];
  let words: SrtSegment[] | undefined;
  if (Array.isArray(tj)) {
    segments = tj;
  } else if (tj && typeof tj === "object") {
    segments = tj.captions ?? [];
    words = tj.words;
  }

  const dbStatus = String(row.status);
  const status: TranscribeJob["status"] =
    dbStatus === "completed"
      ? "done"
      : dbStatus === "failed"
        ? "failed"
        : dbStatus === "processing"
          ? "processing"
          : "uploading";

  return {
    id: String(row.id),
    filename: String(row.original_filename ?? "transcript"),
    sizeBytes: Number(row.original_file_size ?? 0),
    durationSec: Number(row.duration_seconds ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    status,
    segments,
    words,
    transcript:
      (row.transcript_text as string | null) ?? segmentsToTxt(segments),
    language: "ar-TN",
    errorMessage: (row.error_message as string | null) ?? undefined,
  };
}

export interface CreateJobInput {
  userId: string;
  filename: string;
  fileSize: number;
  fileType: string;
  uploadPath: string;
}

/**
 * Create a new transcription job record
 */
export async function createTranscriptionJob(input: CreateJobInput) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: input.userId,
      original_filename: input.filename,
      original_file_size: input.fileSize,
      file_type: input.fileType,
      upload_path: input.uploadPath,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update job status and results
 */
export async function updateJobProgress(
  jobId: string,
  updates: {
    status?: "processing" | "completed" | "failed";
    durationSeconds?: number;
    srtContent?: string;
    transcriptText?: string;
    transcriptJson?: unknown;
    errorMessage?: string;
    minutesCharged?: number;
    processingStartedAt?: string;
    processingCompletedAt?: string;
  }
) {
  const supabase = getSupabaseServerClient();

  // Map camelCase inputs → snake_case DB columns. `updated_at` is set by the
  // jobs_updated_at trigger, so we don't write it here.
  const payload: Record<string, unknown> = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.durationSeconds !== undefined)
    payload.duration_seconds = updates.durationSeconds;
  if (updates.srtContent !== undefined) payload.srt_content = updates.srtContent;
  if (updates.transcriptText !== undefined)
    payload.transcript_text = updates.transcriptText;
  if (updates.transcriptJson !== undefined)
    payload.transcript_json = updates.transcriptJson;
  if (updates.errorMessage !== undefined)
    payload.error_message = updates.errorMessage;
  if (updates.minutesCharged !== undefined)
    payload.minutes_charged = updates.minutesCharged;
  if (updates.processingStartedAt !== undefined)
    payload.processing_started_at = updates.processingStartedAt;
  if (updates.processingCompletedAt !== undefined)
    payload.processing_completed_at = updates.processingCompletedAt;

  const { error } = await supabase.from("jobs").update(payload).eq("id", jobId);

  if (error) throw error;
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's recent jobs (for dashboard)
 */
export async function getUserJobs(userId: string, limit = 10) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
