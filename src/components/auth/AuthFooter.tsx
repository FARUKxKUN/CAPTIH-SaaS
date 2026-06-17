import Link from "next/link";

/**
 * Brand footer below the auth form — the darija line + terms/privacy, matching
 * the original design. `tagline` is the sign-up only "Join Tunisian creators" copy.
 */
export function AuthFooter({ tagline }: { tagline?: string }) {
  return (
    <div className="mt-5 text-center">
      {tagline && <p className="text-xs text-mute">{tagline}</p>}
      <p className="mt-1 font-arabic text-sm text-bone" dir="rtl">
        شكون غيري لي بش يفهمك؟
      </p>
      <p className="mt-3 text-[11px] text-mute">
        By continuing you agree to our{" "}
        <Link href="/legal/terms" className="link-metis text-bone">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/legal/privacy" className="link-metis text-bone">
          Privacy
        </Link>
      </p>
    </div>
  );
}
