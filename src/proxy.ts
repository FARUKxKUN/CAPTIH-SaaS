import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 renamed `middleware.ts` → `proxy.ts`. Clerk's clerkMiddleware()
 * returns a handler compatible with this convention.
 *
 * Two jobs:
 *  1. Auth gating. Routes are public by default; we only PROTECT the app
 *     surfaces that require a signed-in user. The anonymous try-it flow
 *     (/transcribe, /result) and the webhooks must stay reachable. API routes
 *     enforce their own auth too (defence in depth).
 *  2. Per-request nonce CSP. The nonce goes on the request headers (Next.js
 *     reads it from `Content-Security-Policy` to tag its own inline scripts,
 *     and layout.tsx reads `x-nonce` for the theme script) and on the response.
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/editor(.*)",
]);

const isDev = process.env.NODE_ENV !== "production";

// Read once at cold start - values are stable per deployment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseConnectSrc = supabaseUrl
  ? ` ${supabaseUrl} ${supabaseUrl.replace(/^https:/, "wss:")}`
  : "";

const clerkConnectSrc =
  " https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com";

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "";
const posthogConnectSrc = posthogHost
  ? ` ${posthogHost} https://eu-assets.i.posthog.com`
  : "";
// posthog-js lazy-loads its recorder/surveys/config scripts from the assets host.
const posthogScriptSrc = posthogHost ? " https://eu-assets.i.posthog.com" : "";

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https://img.clerk.com",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    // nonce replaces unsafe-inline for scripts
    `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com${posthogScriptSrc}${isDev ? " 'unsafe-eval'" : ""}`,
    "worker-src 'self' blob:",
    "connect-src 'self'" +
      supabaseConnectSrc +
      clerkConnectSrc +
      posthogConnectSrc +
      " https://challenges.cloudflare.com" +
      (isDev ? " ws: http://localhost:* http://127.0.0.1:*" : ""),
    "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
    "upgrade-insecure-requests",
  ].join("; ");
}

// Edge-safe nonce: crypto.getRandomValues is available in the Edge runtime.
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(Array.from(array, (b) => String.fromCharCode(b)).join(""));
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes.
    "/(api|trpc)(.*)",
  ],
};
