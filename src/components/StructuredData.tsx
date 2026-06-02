import { COPY } from "@/lib/copy";

/**
 * JSON-LD structured data for SEO + AI search citation (ChatGPT, Perplexity, AI Overviews).
 *
 * Renders four schema entities as a single @graph:
 *  - Organization (the Captih brand)
 *  - WebSite (the captih.com site with SearchAction)
 *  - SoftwareApplication (the Captih STT tool itself, with AggregateOffer)
 *  - Product (the Captih subscription plans, with Offer per plan)
 *
 * Why: LLMs prefer structured passages for citation. AggregateOffer lets Google
 * surface pricing in rich results. SearchAction enables sitelinks search box.
 */
export function StructuredData() {
  const base = COPY.meta.siteUrl;

  const organization = {
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "Captih",
    alternateName: ["كابتيه", "Captih STT"],
    url: base,
    logo: {
      "@type": "ImageObject",
      url: `${base}/captih-logo-dark.png`,
      width: 520,
      height: 260,
    },
    image: `${base}/opengraph-image`,
    description: COPY.meta.description,
    foundingDate: "2026",
    foundingLocation: {
      "@type": "Place",
      name: "Tunis, Tunisia",
    },
    founder: [
      {
        "@type": "Person",
        name: COPY.footer.creators[0].name,
        url: COPY.footer.creators[0].href,
      },
      {
        "@type": "Person",
        name: COPY.footer.creators[1].name,
      },
    ],
    sameAs: [
      COPY.footer.creators[0].href,
      "https://huggingface.co/FARUKxAUTO",
    ].filter(Boolean),
    knowsLanguage: ["ar-TN", "ar", "en", "fr"],
    areaServed: {
      "@type": "Country",
      name: "Tunisia",
    },
  };

  const website = {
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: "Captih",
    description: COPY.meta.description,
    publisher: { "@id": `${base}/#organization` },
    inLanguage: ["en", "ar-TN", "fr"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/transcribe?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Map each one-time pack to its own Offer (minute-credit packs valid 30 days)
  const packOffers = COPY.pricing.packs.map((pack) => ({
    "@type": "Offer",
    name: `Captih ${pack.minutes}-minute pack`,
    description: `${pack.minutes} minutes of Tunisian darija transcription. ${pack.line}`,
    price: pack.priceDT.toFixed(2),
    priceCurrency: "TND",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: pack.priceDT.toFixed(2),
      priceCurrency: "TND",
      referenceQuantity: {
        "@type": "QuantitativeValue",
        value: pack.minutes,
        unitCode: "MIN",
      },
    },
    availability: "https://schema.org/InStock",
    url: `${base}/transcribe?pack=${pack.id}`,
    seller: { "@id": `${base}/#organization` },
    eligibleRegion: { "@type": "Country", name: "Tunisia" },
  }));

  const prices = packOffers.map((o: { price: string }) => parseFloat(o.price)).filter((n: number) => n > 0);
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  const software = {
    "@type": "SoftwareApplication",
    "@id": `${base}/#software`,
    name: "Captih",
    alternateName: "Captih STT",
    description:
      "Captih is an AI-powered speech-to-text transcription tool specialised in Tunisian Arabic (darija). Upload video or audio, get a timestamped SRT, plain transcript, and word-level JSON. Powered by FARUKxAUTO, a fine-tuned Whisper-large-v3 model trained on 100+ hours of real Tunisian dialect audio.",
    url: base,
    applicationCategory: "MultimediaApplication",
    applicationSubCategory: "Transcription Software",
    operatingSystem: "Web Browser",
    browserRequirements: "Requires JavaScript. Modern browsers (Chrome, Safari, Firefox, Edge).",
    softwareVersion: "1.0",
    inLanguage: ["ar-TN", "ar", "en", "fr"],
    audience: {
      "@type": "Audience",
      audienceType: "Podcasters, content creators, journalists, video editors, researchers working with Tunisian Arabic content",
    },
    featureList: [
      "Tunisian darija speech recognition",
      "SRT subtitle export with timestamps",
      "Plain transcript export",
      "Auto audio extraction from video (MP4, MOV)",
      "Inline SRT editor on all paid packs",
      "Pay-once minute packs (valid 30 days)",
      "Custom hour purchases (1–30 hours)",
    ],
    creator: { "@id": `${base}/#organization` },
    publisher: { "@id": `${base}/#organization` },
    image: `${base}/opengraph-image`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: lowPrice.toFixed(2),
      highPrice: highPrice.toFixed(2),
      priceCurrency: "TND",
      offerCount: packOffers.length,
      offers: packOffers,
    },
    aggregateRating: undefined, // populate when real reviews exist; omitting is safer than fabricating
  };

  const product = {
    "@type": "Product",
    "@id": `${base}/#product`,
    name: "Captih - Tunisian darija subtitle generator",
    description: COPY.meta.description,
    brand: { "@id": `${base}/#organization` },
    image: `${base}/opengraph-image`,
    category: "Speech-to-Text Software",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: lowPrice.toFixed(2),
      highPrice: highPrice.toFixed(2),
      priceCurrency: "TND",
      offerCount: packOffers.length,
      offers: packOffers,
    },
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [organization, website, software, product],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify produces safe JSON — no user input here, schema is fully static
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
