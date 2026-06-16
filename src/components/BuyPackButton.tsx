"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";

/**
 * Buy-a-pack button. Signed in → starts Dhmad checkout and redirects to the
 * payment page. Signed out → sends to sign-up first (then they can buy).
 *
 * packId comes from COPY (e.g. "pack-30"); we normalize to the API's
 * pack_type ("pack_30").
 */
export function BuyPackButton({
  packId,
  label,
  highlight,
}: {
  packId: string;
  label: string;
  highlight?: boolean;
}) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packType = packId.replace("-", "_"); // pack-30 → pack_30

  const handleClick = async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=/%23pricing`);
      return;
    }
    setBusy(true);
    setError(null);
    track("topup_clicked", { pack_type: packType });
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pack_type: packType }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }
      // Redirect to Dhmad hosted checkout.
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`block w-full rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5 disabled:opacity-60 ${
          highlight
            ? "bg-signal text-ink hover:bg-signal/90"
            : "border border-line bg-ink text-bone hover:border-mute"
        }`}
      >
        {busy ? "Starting checkout…" : label}
      </button>
      {error && <p className="mt-2 text-center text-xs text-signal">{error}</p>}
    </div>
  );
}
