"use client";

import { type ReactNode } from "react";
import {
  useUser,
  useClerk,
  useAuth as useClerkAuth,
} from "@clerk/nextjs";

// Clerk is the auth provider now.
export const IS_CLERK_CONFIGURED = true;

// ────────────────────────────────────────────────────────────────────────────
// Public auth API — kept stable so existing components don't change.
// Re-implemented on top of Clerk (was Supabase).
// ────────────────────────────────────────────────────────────────────────────

export type SafeUser = {
  readonly id?: string;
  readonly firstName?: string | null;
  readonly fullName?: string | null;
  readonly email?: string | null;
  readonly imageUrl?: string | null;
};

export type AuthState = {
  readonly isLoaded: boolean;
  readonly isSignedIn: boolean;
  readonly user: SafeUser | null;
  readonly isClerkConfigured: boolean;
  readonly signOut: () => void;
};

/**
 * Bridge hook — maps Clerk's user/session into the app's stable AuthState.
 */
export function useAuth(): AuthState {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  return {
    isLoaded,
    isSignedIn: !!isSignedIn,
    isClerkConfigured: true,
    signOut: () => {
      void signOut();
    },
    user: user
      ? {
          id: user.id,
          firstName: user.firstName ?? user.username ?? null,
          fullName: user.fullName ?? null,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          imageUrl: user.imageUrl ?? null,
        }
      : null,
  };
}

/**
 * AuthBridge — no longer holds state itself (Clerk's <ClerkProvider> does).
 * Kept as a passthrough so layout.tsx's structure is unchanged. Aliases below
 * preserve old import sites.
 */
export function AuthBridge({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const SupabaseAuthProvider = AuthBridge;
export const MockAuthProvider = AuthBridge;
export const NoClerkAuthProvider = AuthBridge;
export const ClerkAuthBridge = AuthBridge;

// ────────────────────────────────────────────────────────────────────────────
// Declarative gate — unchanged API.
// ────────────────────────────────────────────────────────────────────────────

export function AuthGate({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  if (!isLoaded) return null;
  if (when === "signed-in" && !isSignedIn) return null;
  if (when === "signed-out" && isSignedIn) return null;
  return <>{children}</>;
}
