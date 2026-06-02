import type { Metadata } from "next";
import {
  Inter,
  Inter_Tight,
  JetBrains_Mono,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { COPY } from "@/lib/copy";
import { MockAuthProvider } from "@/lib/auth";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { ThemeProvider, NoFlashThemeScript } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: COPY.meta.title,
  description: COPY.meta.description,
  metadataBase: new URL("https://captih.com"),
  openGraph: {
    title: COPY.meta.title,
    description: COPY.meta.description,
    type: "website",
    locale: "en_US",
    siteName: "Captih",
  },
  twitter: {
    card: "summary_large_image",
    title: COPY.meta.title,
    description: COPY.meta.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} ${plexArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <NoFlashThemeScript />
      </head>
      <body className="min-h-screen bg-ink text-bone antialiased">
        <ThemeProvider>
          <MockAuthProvider>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </MockAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
