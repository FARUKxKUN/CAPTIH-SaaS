import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Captih - Tunisian subtitles, captured.",
    short_name: "Captih",
    description:
      "The first speech-to-text tool that actually transcribes Tunisian darija. Drop a video, get a perfect SRT.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B0F",
    theme_color: "#0B0B0F",
    orientation: "portrait-primary",
    categories: ["productivity", "utilities", "multimedia"],
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/captih-symbol-dark.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
