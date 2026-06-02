"use client";

import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignInPage() {
  const params = useSearchParams();
  const redirectUrl = params.get("redirect_url") ?? "/dashboard";

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <AuthLayout
        eyebrow="Welcome back"
        title={
          <>
            Pick up
            <br />
            <span className="text-signal">where you left.</span>
          </>
        }
        subtitle="Your transcripts, your packs, your dashboard — right where you left them."
      >
        <AuthForm initialMode="sign-in" redirectUrl={redirectUrl} />
      </AuthLayout>
    </div>
  );
}
