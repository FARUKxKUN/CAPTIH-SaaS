"use client";

import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignUpPage() {
  const params = useSearchParams();
  const redirectUrl = params.get("redirect_url") ?? "/dashboard";

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
        <AuthForm initialMode="sign-up" redirectUrl={redirectUrl} />
      </AuthLayout>
    </div>
  );
}
