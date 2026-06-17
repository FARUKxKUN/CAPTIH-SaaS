import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FoundingOfferSection } from "@/components/FoundingOfferSection";
import { PricingSection } from "@/components/PricingSection";

export const metadata: Metadata = {
  title: "Pricing · Captih",
  description:
    "Captih pricing - pay once for transcription minutes. Packs from 5 DT, valid 30 days. Tunisian darija speech-to-text.",
};

export default function PricingPage() {
  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col pt-20 sm:pt-24">
        <FoundingOfferSection />
        <PricingSection />
      </main>
      <SiteFooter />
    </div>
  );
}
