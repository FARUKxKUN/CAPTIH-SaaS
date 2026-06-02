import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroSection } from "@/components/HeroSection";
import { OurStorySection } from "@/components/OurStorySection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { ComparisonSection } from "@/components/ComparisonSection";
import { TrustStripSection } from "@/components/TrustStripSection";
import { FoundingOfferSection } from "@/components/FoundingOfferSection";
import { PricingSection } from "@/components/PricingSection";

export default function Home() {
  return (
    <div className="noise relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        {/*
          Rubin's cut: the page used to read like a pricing page. This is
          the moment where the visitor finds out who built it and why.
        */}
        <OurStorySection />
        <HowItWorksSection />
        <ComparisonSection />
        <TrustStripSection />
        <FoundingOfferSection />
        <PricingSection />
      </main>
      <SiteFooter />
    </div>
  );
}
