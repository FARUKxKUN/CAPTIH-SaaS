import { createClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";

const FREE_MINUTES = 3;

// Server-side client using SERVICE_ROLE_KEY (bypasses RLS).
// Supabase is data-only now; auth is handled by Clerk.
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Ensure the Clerk user exists in Supabase with their free-tier credits.
 *
 * The Clerk webhook (/api/clerk-webhook) is the primary sync path in
 * production. This is a safety net: if the webhook hasn't fired yet (it can't
 * reach localhost in dev, and may be delayed/retried in prod), the user is
 * synced + granted free minutes on their first authenticated request. Fully
 * idempotent — never double-grants credits.
 */
async function ensureUserSynced(userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  // Already synced? Cheap existence check.
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return;

  // Pull profile from Clerk for the email/name. This hits Clerk's API
  // (accounts.dev) which can be slow/flaky from some networks — time-box it
  // so a new-user sync never hangs the request. If it fails, insert with a
  // placeholder email; the Clerk webhook (or a later request) reconciles it.
  let email = `${userId}@no-email.captih`;
  let displayName: string | null = null;
  try {
    const user = await Promise.race([
      currentUser(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("currentUser timeout")), 4000)
      ),
    ]);
    if (user) {
      email =
        user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ??
        user.emailAddresses?.[0]?.emailAddress ??
        email;
      displayName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    }
  } catch (err) {
    console.error("[ensureUserSynced] currentUser failed, using placeholder:", err);
  }

  await supabase.from("users").upsert(
    { id: userId, email, display_name: displayName, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );

  // Grant free credits only if the user has none yet (idempotent).
  const { count } = await supabase
    .from("credits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!count) {
    await supabase.from("credits").insert({
      user_id: userId,
      pack_type: "free",
      total_minutes: FREE_MINUTES,
      minutes_used: 0,
      expires_at: null,
      is_active: true,
    });
  }
}

/**
 * Get the authenticated user in API Route Handlers.
 * Auth is Clerk. The returned `id` is the Clerk user ID, which is also the
 * primary key in our public.users table.
 *
 * Also runs the sync safety net so a freshly signed-up user always has a row
 * + free credits, even before the Clerk webhook lands.
 */
export async function getAuthUser(_request?: Request) {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    await ensureUserSynced(userId);
  } catch (err) {
    // Sync failure must not block auth — the webhook will reconcile later.
    console.error("[getAuthUser] ensureUserSynced failed:", err);
  }
  return { id: userId };
}
