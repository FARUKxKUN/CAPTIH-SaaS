import { NextResponse } from "next/server";
import { getSupabaseServerClient, getAuthUser } from "@/lib/supabase-server";
import { getUserActiveMinutes } from "@/lib/credit-system";

/**
 * GET /api/credits
 * Returns user's credit balance (active, unexpired minutes)
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const supabase = getSupabaseServerClient();

    // Get all credit packs for this user
    const { data: credits, error } = await supabase
      .from("credits")
      .select(
        "id, pack_type, total_minutes, minutes_used, minutes_remaining, expires_at, created_at"
      )
      .eq("user_id", userId)
      .order("expires_at", { ascending: true, nullsFirst: true });

    if (error) throw error;

    // Calculate active minutes (unexpired)
    const activeMinutes = await getUserActiveMinutes(userId);

    // Parse expiry dates and mark active/inactive
    const creditPacks = (credits || []).map((pack) => ({
      ...pack,
      isActive:
        !pack.expires_at || new Date(pack.expires_at) > new Date(),
      expiresIn: pack.expires_at
        ? Math.max(
            0,
            Math.floor(
              (new Date(pack.expires_at).getTime() - Date.now()) / 1000 / 60
            )
          )
        : null,
    }));

    return NextResponse.json({
      user_id: userId,
      balance: activeMinutes,
      packs: creditPacks,
    });
  } catch (error) {
    console.error("/api/credits error", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/credits/purchase
 * Create a new credit pack (called after Dhmad.tn payment webhook)
 * Body: { pack_type: 'pack_30' | 'pack_60' | 'pack_180' | 'custom', minutes?: number, amount_dt?: number, transaction_id?: string }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const body = await request.json();
    const { pack_type, minutes, amount_dt, transaction_id } = body;

    if (!pack_type) {
      return NextResponse.json(
        { error: "pack_type is required" },
        { status: 400 }
      );
    }

    const packConfigs: Record<
      string,
      { minutes: number; daysValid: number }
    > = {
      pack_10: { minutes: 10, daysValid: 365 },
      pack_30: { minutes: 30, daysValid: 365 },
      pack_60: { minutes: 60, daysValid: 365 },
      pack_180: { minutes: 180, daysValid: 365 },
      custom: { minutes: minutes || 0, daysValid: 30 },
    };

    const config = packConfigs[pack_type];
    if (!config || config.minutes === 0) {
      return NextResponse.json(
        { error: "Invalid pack_type or missing minutes for custom pack" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Create transaction first
    const { data: txn, error: txnError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        transaction_type: "credit_purchase",
        minutes_delta: config.minutes,
        payment_id: transaction_id,
        amount_dt: amount_dt || null,
        status: "completed",
        description: `Purchased ${pack_type}`,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Create credit pack
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.daysValid);

    const { data: credit, error: creditError } = await supabase
      .from("credits")
      .insert({
        user_id: userId,
        pack_type,
        total_minutes: config.minutes,
        minutes_used: 0,
        expires_at: expiresAt.toISOString(),
        transaction_id: txn.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (creditError) throw creditError;

    return NextResponse.json(
      {
        success: true,
        credit: {
          id: credit.id,
          pack_type,
          total_minutes: config.minutes,
          expires_at: credit.expires_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("/api/credits POST error", error);
    return NextResponse.json(
      { error: "Failed to purchase credits" },
      { status: 500 }
    );
  }
}
