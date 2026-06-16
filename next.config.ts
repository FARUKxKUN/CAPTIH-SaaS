import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

// Build CSP per environment. React dev mode needs 'unsafe-eval'; Three.js
// Draco/KTX2 wasm decoders need 'wasm-unsafe-eval' in both. Tailwind + Next
// hydration JSON need 'unsafe-inline' for styles + scripts until we wire a
// per-request nonce via middleware.
const isDev = process.env.NODE_ENV !== "production";

// Allow the app to talk to its Supabase project (REST + Auth over https,
// Realtime over wss). Derived from the public URL so it follows the env.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseConnectSrc = supabaseUrl
  ? ` ${supabaseUrl} ${supabaseUrl.replace(/^https:/, "wss:")}`
  : "";

// Clerk auth: clerk-js calls its Frontend API at <instance>.clerk.accounts.dev
// and loads avatars from img.clerk.com. Allow the whole clerk.accounts.dev
// space (the instance subdomain varies) plus *.clerk.com.
const clerkConnectSrc =
  " https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com";

// PostHog analytics: ingest events + session replay assets (EU region).
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const posthogConnectSrc = posthogHost
  ? ` ${posthogHost} https://eu-assets.i.posthog.com`
  : "";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Clerk loads Cloudflare Turnstile (bot protection) from challenges.cloudflare.com.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "worker-src 'self' blob:",
  "connect-src 'self'" +
    supabaseConnectSrc +
    clerkConnectSrc +
    posthogConnectSrc +
    " https://challenges.cloudflare.com" +
    (isDev ? " ws: http://localhost:* http://127.0.0.1:*" : ""),
  // Clerk renders some flows (verification, Turnstile widget) in iframes.
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "upgrade-insecure-requests",
].join("; ");

SECURITY_HEADERS.push({ key: "Content-Security-Policy", value: csp });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
