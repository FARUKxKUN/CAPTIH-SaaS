import { getSupabaseServerClient } from "./supabase-server";

/**
 * Get user's remaining active (unexpired) minutes
 */
export async function getUserActiveMinutes(userId: string): Promise<number> {
  const supabase = getSupabaseServerClient();

  const result = await supabase
    .from("credits")
    .select("minutes_remaining")
    .eq("user_id", userId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (result.error) throw result.error;

  const totalMinutes = (result.data || []).reduce(
    (sum, row) => sum + (row.minutes_remaining || 0),
    0
  );

  return totalMinutes;
}

/**
 * Deduct minutes from a user's credit pack (oldest expiring first)
 * Returns true if successful, false if insufficient credits
 */
export async function deductUserMinutes(
  userId: string,
  minutesToDeduct: number
): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  // Call the custom database function defined in 20260602_init_captih_schema.sql
  const { data, error } = await supabase.rpc("deduct_credit_minutes", {
    user_uuid: userId,
    minutes_to_deduct: minutesToDeduct,
  });

  if (error) throw error;
  return !!data;
}

/**
 * Create a credit transaction log
 */
export async function createTransaction(
  userId: string,
  type: "credit_purchase" | "credit_deduction" | "refund",
  minutesDelta: number,
  jobId?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    transaction_type: type,
    minutes_delta: minutesDelta,
    job_id: jobId,
    status: "completed",
    metadata,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  if (error) throw error;
}

/**
 * Refund minutes to a user (when transcription fails)
 */
export async function refundUserMinutes(
  userId: string,
  jobId: string,
  minutesToRefund: number,
  reason: string
) {
  const supabase = getSupabaseServerClient();

  // Mark job as refunded. updated_at is maintained by the jobs_updated_at trigger.
  const { error: jobError } = await supabase
    .from("jobs")
    .update({
      is_refunded: true,
      refund_reason: reason,
    })
    .eq("id", jobId);

  if (jobError) throw jobError;

  // Actually return the minutes: add them back to the user's most-recently-used
  // active pack (the one we most likely just deducted from).
  const { data: pack, error: packErr } = await supabase
    .from("credits")
    .select("id, minutes_used")
    .eq("user_id", userId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .gt("minutes_used", 0)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (packErr) throw packErr;

  if (pack) {
    const restored = Math.max(0, (pack.minutes_used as number) - minutesToRefund);
    const { error: updErr } = await supabase
      .from("credits")
      .update({ minutes_used: restored })
      .eq("id", pack.id);
    if (updErr) throw updErr;
  }

  // Log the refund transaction
  await createTransaction(userId, "refund", minutesToRefund, jobId, {
    reason,
  });
}
