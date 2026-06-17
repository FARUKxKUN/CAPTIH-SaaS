import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getPack } from "@/lib/packs";
import { deliverEscrow } from "@/lib/dhmad";

/**
 * POST /api/webhooks/dhmad
 * Dhmad escrow webhook. We care about `escrow.status.updated` going to `paid`:
 * that means the buyer paid → credit the pack's minutes → deliver the escrow
 * (instant mode auto-completes + releases funds).
 *
 * Security (per Dhmad docs):
 *  - signature: HMAC-SHA256 of JSON.stringify(body), hex, header X-Webhook-Signature
 *  - replay: reject if X-Webhook-Timestamp > 5 min old
 *  - idempotency: dedupe on X-Webhook-Id
 */

export const runtime = "nodejs";

const FIVE_MIN_MS = 5 * 60 * 1000;

type EscrowWebhook = {
  id: string;
  type: string;
  timestamp: string;
  data: {
    escrow?: {
      id?: string;
      _id?: string;
      status: string;
      oldStatus?: string;
    };
  };
};

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  // timingSafeEqual throws if lengths differ — guard first.
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.DHMAD_WEBHOOK_SECRET;
  if (!secret || secret.startsWith("YOUR_")) {
    console.error("[dhmad-webhook] DHMAD_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Read the raw body EXACTLY as sent — signature is over the raw bytes.
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const eventType = request.headers.get("x-webhook-event") ?? "";
  const webhookId = request.headers.get("x-webhook-id") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

  // Replay protection.
  const age = Date.now() - new Date(timestamp).getTime();
  if (!timestamp || Number.isNaN(age) || age > FIVE_MIN_MS) {
    return NextResponse.json({ error: "Stale event" }, { status: 400 });
  }

  // Signature.
  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: EscrowWebhook;
  try {
    event = JSON.parse(rawBody) as EscrowWebhook;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // Idempotency: skip if we've already processed this webhook id.
  const { data: seen } = await supabase
    .from("transactions")
    .select("id")
    .eq("metadata->>webhook_id", webhookId)
    .maybeSingle();
  if (seen) {
    return NextResponse.json({ received: true, deduped: true });
  }

  try {
    const type = event.type || eventType;
    const escrow = event.data?.escrow;
    // Dhmad uses `_id` on create; webhook may send `id` or `_id`. Accept both.
    const escrowId = escrow?.id ?? escrow?._id;

    // Only act when an escrow becomes `paid`.
    if (type === "escrow.status.updated" && escrow?.status === "paid" && escrowId) {
      // Find the pending transaction we created for this escrow.
      const { data: txn, error: txnErr } = await supabase
        .from("transactions")
        .select("id, user_id, status, metadata")
        .eq("payment_id", escrowId)
        .maybeSingle();
      if (txnErr) throw txnErr;

      if (!txn) {
        // No matching transaction — log and 200 so Dhmad doesn't retry forever.
        console.error("[dhmad-webhook] no transaction for escrow", escrowId);
        return NextResponse.json({ received: true, unmatched: true });
      }

      // Already completed? dedupe.
      if (txn.status === "completed") {
        return NextResponse.json({ received: true, alreadyCompleted: true });
      }

      const packType = (txn.metadata as { pack_type?: string })?.pack_type;
      const pack = getPack(packType ?? "");
      if (!pack) {
        console.error("[dhmad-webhook] unknown pack_type on txn", txn.id);
        return NextResponse.json({ received: true, badPack: true });
      }

      // Credit the minutes: create the credit pack.
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + pack.daysValid);
      const { error: creditErr } = await supabase.from("credits").insert({
        user_id: txn.user_id,
        pack_type: pack.type,
        total_minutes: pack.minutes,
        minutes_used: 0,
        expires_at: expiresAt.toISOString(),
        transaction_id: txn.id,
        is_active: true,
      });
      if (creditErr) throw creditErr;

      // Mark the transaction completed + record webhook id for idempotency.
      await supabase
        .from("transactions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          metadata: { ...(txn.metadata as object), webhook_id: webhookId },
        })
        .eq("id", txn.id);

      // Deliver the escrow → instant mode auto-completes + releases funds.
      const delivered = await deliverEscrow(escrowId);
      if (!delivered.ok) {
        // Non-fatal: minutes are already credited. Log for manual follow-up.
        console.error("[dhmad-webhook] deliver failed:", delivered.error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[dhmad-webhook] processing error:", err);
    // 500 → Dhmad retries (server error is retryable per their docs).
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
