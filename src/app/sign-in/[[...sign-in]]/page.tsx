"use client";

import { SignIn } from "@clerk/nextjs";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
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
        <AuthTabs active="sign-in" />
        <SignIn
          appearance={clerkAppearance}
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
        />
        <AuthFooter />
      </AuthLayout>
    </div>
  );
}
