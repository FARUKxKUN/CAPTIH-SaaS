/**
 * Dhmad escrow/payment client (server-only).
 *
 * CAPTIH sells in-app digital goods (transcription minutes), so we use Dhmad's
 * `instant` escrow mode: we are the seller, the user is the buyer, payment is
 * one step, and the escrow auto-completes when we call deliver.
 *
 * Flow:
 *   1. createInstantEscrow()  → POST /escrows (mode: instant)
 *   2. createCheckoutSession() → POST /escrows/:id/sessions (accept_pay) → URL
 *   3. user pays on dhmad.tn → webhook escrow.status.updated (pending→paid)
 *   4. on `paid`: credit minutes, then deliverEscrow() to auto-complete
 *
 * Docs: https://dhmad.tn — Escrows, Checkout Sessions, Webhooks.
 */

const DHMAD_API_KEY = process.env.DHMAD_API_KEY;
// Sandbox keys (sk_sandbox_) hit the sandbox base URL; live keys hit prod.
const DHMAD_BASE_URL = (DHMAD_API_KEY ?? "").startsWith("sk_sandbox_")
  ? "https://sandbox.dhmad.tn/api/v1"
  : "https://dhmad.tn/api/v1";

type DhmadResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function dhmadFetch<T>(
  path: string,
  init: RequestInit
): Promise<DhmadResult<T>> {
  if (!DHMAD_API_KEY) {
    return { ok: false, error: "Dhmad not configured (DHMAD_API_KEY missing)" };
  }
  try {
    const res = await fetch(`${DHMAD_BASE_URL}${path}`, {
      ...init,
      headers: {
        "X-API-Key": DHMAD_API_KEY,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: json?.message || json?.error || `Dhmad ${res.status}`,
      };
    }
    return { ok: true, data: json as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Dhmad request failed",
    };
  }
}

export type CreateEscrowInput = {
  buyerEmail: string;
  amount: number; // TND
  title: string;
  metadata?: Record<string, unknown>;
};

type EscrowResponse = {
  escrow?: { id: string; status: string };
  data?: { id: string; status: string };
  id?: string;
};

/** Create an `instant` escrow (we are the seller — omit sellerEmail). */
export async function createInstantEscrow(
  input: CreateEscrowInput
): Promise<DhmadResult<{ escrowId: string }>> {
  const result = await dhmadFetch<EscrowResponse>("/escrows", {
    method: "POST",
    body: JSON.stringify({
      mode: "instant",
      buyerEmail: input.buyerEmail,
      amount: input.amount,
      currency: "TND",
      title: input.title,
      metadata: input.metadata,
    }),
  });
  if (!result.ok) return result;

  const escrowId =
    result.data.escrow?.id ?? result.data.data?.id ?? result.data.id;
  if (!escrowId) {
    return { ok: false, error: "Dhmad: no escrow id in response" };
  }
  return { ok: true, data: { escrowId } };
}

type SessionResponse = { url?: string; data?: { url?: string } };

/**
 * Create an accept_pay checkout session and return the redirect URL.
 * `successUrl`/`cancelUrl` send the user back to our app after Dhmad.
 */
export async function createCheckoutSession(
  escrowId: string,
  opts: { successUrl: string; cancelUrl: string }
): Promise<DhmadResult<{ url: string }>> {
  const result = await dhmadFetch<SessionResponse>(
    `/escrows/${escrowId}/sessions`,
    {
      method: "POST",
      body: JSON.stringify({
        action: "accept_pay",
        successUrl: opts.successUrl,
        cancelUrl: opts.cancelUrl,
      }),
    }
  );
  if (!result.ok) return result;

  const url = result.data.url ?? result.data.data?.url;
  if (!url) return { ok: false, error: "Dhmad: no checkout url in response" };
  return { ok: true, data: { url } };
}

/** Mark an instant escrow delivered → auto-completes + releases funds. */
export async function deliverEscrow(
  escrowId: string
): Promise<DhmadResult<unknown>> {
  return dhmadFetch(`/escrows/${escrowId}/deliver`, { method: "POST" });
}
