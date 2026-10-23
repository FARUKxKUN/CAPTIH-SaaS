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

// Credits are granted ONLY by the signed Dhmad webhook
// (src/app/api/webhooks/dhmad/route.ts). There is deliberately no POST here:
// a client-callable "add credits" endpoint would let any signed-in user mint
// minutes without paying.
