import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * POST /api/clerk-webhook
 * Clerk → Supabase sync. Subscribe in Clerk dashboard to:
 *   user.created, user.updated, user.deleted
 *
 * On user.created we also grant the free tier: a 'free' 3-minute credit pack
 * (no expiry). This is what makes the free trial work end-to-end.
 *
 * Signature is verified with svix using CLERK_WEBHOOK_SECRET.
 */

export const runtime = "nodejs";

const FREE_MINUTES = 3;

type ClerkEmail = { id: string; email_address: string };
type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};
type ClerkEvent = {
  type: string;
  data: ClerkUserData;
};

function primaryEmail(data: ClerkUserData): string | null {
  const list = data.email_addresses ?? [];
  if (list.length === 0) return null;
  const primary = list.find((e) => e.id === data.primary_email_address_id);
  return (primary ?? list[0]).email_address ?? null;
}

function displayName(data: ClerkUserData): string | null {
  const parts = [data.first_name, data.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Verify signature with svix.
  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: ClerkEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers) as ClerkEvent;
  } catch (err) {
    console.error("[clerk-webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { type, data } = event;

  try {
    if (type === "user.created" || type === "user.updated") {
      const email = primaryEmail(data);

      // Upsert the user row.
      const { error: userErr } = await supabase.from("users").upsert(
        {
          id: data.id,
          email: email ?? `${data.id}@no-email.captih`,
          display_name: displayName(data),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (userErr) throw userErr;

      // Grant free credits ONCE, only on creation, and only if the user has
      // no credit pack yet (idempotent against webhook retries).
      if (type === "user.created") {
        const { count, error: countErr } = await supabase
          .from("credits")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.id);
        if (countErr) throw countErr;

        if (!count) {
          const { error: creditErr } = await supabase.from("credits").insert({
            user_id: data.id,
            pack_type: "free",
            total_minutes: FREE_MINUTES,
            minutes_used: 0,
            expires_at: null, // free tier never expires
            is_active: true,
          });
          if (creditErr) throw creditErr;
        }
      }
    } else if (type === "user.deleted") {
      // CASCADE removes credits/jobs/transactions.
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", data.id);
      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[clerk-webhook] processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
