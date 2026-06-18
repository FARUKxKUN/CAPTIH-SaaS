import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Persistent rate limiter backed by Supabase `rate_limits` table.
 * Safe across all serverless instances - no in-memory state.
 * Fails OPEN on DB errors so a Supabase outage never blocks users.
 */
export async function rateLimitByKey(
  key: string,
  opts?: { windowMs?: number; max?: number }
): Promise<{ ok: boolean; retryAfter: number }> {
  const windowMs = opts?.windowMs ?? 60_000;
  const max = opts?.max ?? 10;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    const supabase = getSupabaseServerClient();

    const { data: existing } = await supabase
      .from("rate_limits")
      .select("hits, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (!existing || new Date(existing.reset_at) < now) {
      await supabase.from("rate_limits").upsert({
        key,
        hits: 1,
        reset_at: resetAt.toISOString(),
      });
      return { ok: true, retryAfter: 0 };
    }

    if (existing.hits >= max) {
      const retryAfter = Math.ceil(
        (new Date(existing.reset_at).getTime() - now.getTime()) / 1000
      );
      return { ok: false, retryAfter };
    }

    await supabase
      .from("rate_limits")
      .update({ hits: existing.hits + 1 })
      .eq("key", key);

    return { ok: true, retryAfter: 0 };
  } catch (err) {
    console.error("[rate-limit-db] DB error, failing open:", err);
    return { ok: true, retryAfter: 0 };
  }
}
