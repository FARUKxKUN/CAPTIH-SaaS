import { NextResponse } from "next/server";
import { getAuthUser, getSupabaseServerClient } from "@/lib/supabase-server";
import { getJob, jobRowToTranscribeJob } from "@/lib/job-system";
import { segmentsToTxt, type SrtSegment } from "@/lib/transcribe";

/**
 * GET /api/jobs/[id]
 * Get a specific job's details and download links
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const { id } = await params;
    const job = await getJob(id);

    // Verify ownership
    if (job.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return the TranscribeJob shape the frontend consumes.
    return NextResponse.json({ job: jobRowToTranscribeJob(job) });
  } catch (error) {
    console.error("/api/jobs/[id] error", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update a job's segments (editor auto-save). Paid users only — enforced
 * client-side; here we just verify ownership.
 * Body: { segments: SrtSegment[] }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await getJob(id);
    if (job.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { segments?: SrtSegment[] };
    const segments = body.segments ?? [];

    // Preserve the raw words (for re-formatting) while updating the captions
    // the user edited. transcript_json holds { words, captions }.
    const existing = job.transcript_json as
      | { words?: SrtSegment[]; captions?: SrtSegment[] }
      | SrtSegment[]
      | null;
    const words = Array.isArray(existing) ? undefined : existing?.words;

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("jobs")
      .update({
        transcript_json: { words, captions: segments },
        transcript_text: segmentsToTxt(segments),
      })
      .eq("id", id);

    if (error) throw error;

    const updated = await getJob(id);
    return NextResponse.json({ job: jobRowToTranscribeJob(updated) });
  } catch (error) {
    console.error("/api/jobs/[id] PATCH error", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await getJob(id);
    if (job.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/jobs/[id] DELETE error", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
