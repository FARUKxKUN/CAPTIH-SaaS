import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-32 sm:px-10 sm:pt-36">
        <div className="w-full max-w-3xl">
          <nav className="mb-10 flex items-center gap-4 font-mono text-xs uppercase tracking-wider text-mute">
            <Link href="/legal/privacy" className="hover:text-bone">
              Privacy
            </Link>
            <span className="text-line">·</span>
            <Link href="/legal/terms" className="hover:text-bone">
              Terms
            </Link>
            <span className="text-line">·</span>
            <Link href="/" className="hover:text-bone">
              Back to captih.com
            </Link>
          </nav>
          <article className="legal-prose space-y-6 text-base leading-relaxed text-bone/90">
            {children}
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
