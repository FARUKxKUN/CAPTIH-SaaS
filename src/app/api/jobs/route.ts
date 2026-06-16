import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";
import { getUserJobs, jobRowToTranscribeJob } from "@/lib/job-system";

/**
 * GET /api/jobs
 * Returns user's recent transcription jobs (for dashboard)
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const jobs = await getUserJobs(userId, Math.min(limit, 100));

    return NextResponse.json({
      user_id: userId,
      jobs: jobs.map(jobRowToTranscribeJob),
    });
  } catch (error) {
    console.error("/api/jobs error", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
