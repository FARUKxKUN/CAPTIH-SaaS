import type { MetadataRoute } from "next";
import { COPY } from "@/lib/copy";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = COPY.meta.siteUrl;
  const now = new Date();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          "en-US": `${base}/`,
          "ar-TN": `${base}/`,
          "fr-TN": `${base}/`,
          "x-default": `${base}/`,
        },
      },
    },
    {
      url: `${base}/#how`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/#vs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/#pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
