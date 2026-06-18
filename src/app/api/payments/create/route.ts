import { NextResponse } from "next/server";
import { getAuthUser, getSupabaseServerClient } from "@/lib/supabase-server";
import { createInstantEscrow, createCheckoutSession } from "@/lib/dhmad";
import { getPack } from "@/lib/packs";
import { currentUser } from "@clerk/nextjs/server";
import { rateLimitByKey } from "@/lib/rate-limit-db";

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * POST /api/payments/create
 * Body: { pack_type: "pack_10" | "pack_30" | "pack_60" | "pack_180" }
 *
 * Creates a Dhmad `instant` escrow + accept_pay checkout session and returns
 * the redirect URL. The pack_type is recorded (in our `transactions` row and
 * the escrow metadata) so the webhook knows how many minutes to credit.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Reject oversized bodies before parsing JSON.
    const contentLength = Number(request.headers.get("content-length") ?? "");
    if (Number.isFinite(contentLength) && contentLength > 1024) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to buy credits." }, { status: 401 });
    }

    const rl = await rateLimitByKey(`payment:${user.id}`, {
      windowMs: 15 * 60_000,
      max: 5,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many payment requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = (await request.json()) as { pack_type?: string };
    const pack = getPack(body.pack_type ?? "");
    if (!pack) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    // Buyer email = the signed-in user's email (Dhmad needs an email).
    const clerkUser = await currentUser().catch(() => null);
    const buyerEmail =
      clerkUser?.emailAddresses?.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ?? clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (!buyerEmail) {
      return NextResponse.json(
        { error: "No email on account." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Create a pending transaction first so we can correlate the webhook back
    // to this user + pack even if Dhmad's metadata round-trip is lossy.
    const { data: txn, error: txnError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        transaction_type: "credit_purchase",
        minutes_delta: pack.minutes,
        payment_provider: "dhmad",
        amount_dt: pack.amount,
        status: "pending",
        description: `Purchase ${pack.label}`,
        metadata: { pack_type: pack.type },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (txnError) throw txnError;

    // Create the instant escrow on Dhmad.
    const escrow = await createInstantEscrow({
      buyerEmail,
      amount: pack.amount,
      title: `CAPTIH — ${pack.label}`,
      metadata: {
        user_id: user.id,
        pack_type: pack.type,
        transaction_id: txn.id,
      },
    });
    if (!escrow.ok) {
      await supabase
        .from("transactions")
        .update({ status: "failed", description: escrow.error })
        .eq("id", txn.id);
      return NextResponse.json({ error: escrow.error }, { status: 502 });
    }

    // Store the escrow id on the transaction for webhook correlation.
    await supabase
      .from("transactions")
      .update({ payment_id: escrow.data.escrowId })
      .eq("id", txn.id);

    // Create the checkout session and return the redirect URL. Dhmad appends
    // ?session_id=...&status=... to redirectUrl, so we send the clean /dashboard
    // (which is in the dashboard's allowed redirect URLs).
    const origin = new URL(request.url).origin;
    const session = await createCheckoutSession(escrow.data.escrowId, {
      redirectUrl: `${origin}/dashboard`,
      targetUserEmail: buyerEmail,
    });
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: 502 });
    }

    return NextResponse.json({ url: session.data.url });
  } catch (error) {
    console.error("/api/payments/create error", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
