"use client";

import { SignUp } from "@clerk/nextjs";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <AuthLayout
        eyebrow="Welcome"
        title={
          <>
            Captih the
            <br />
            <span className="text-signal">sound.</span>
          </>
        }
        subtitle={
          <>
            The first subtitle tool that actually speaks Tunisian.{" "}
            <span className="font-arabic text-bone" dir="rtl">
              نحكي بالتونسي.
            </span>
          </>
        }
      >
        <AuthTabs active="sign-up" />
        <SignUp
          appearance={clerkAppearance}
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
        />
        <AuthFooter tagline="Join Tunisian creators on Captih. Trained on 93 hrs of real darija." />
      </AuthLayout>
    </div>
  );
}
