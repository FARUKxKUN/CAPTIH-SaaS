import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/pricing",
  "/examples(.*)",
  "/legal(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isDev = process.env.NODE_ENV !== "production";

// These are read once at cold start - values are stable per deployment.
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
    `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com${isDev ? " 'unsafe-eval'" : ""}`,
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

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (!isPublic(request)) {
    await auth.protect();
  }

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files so they don't incur overhead.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
