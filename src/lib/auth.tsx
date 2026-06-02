"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMockUser,
  onMockAuthChange,
  signOutMock,
  type MockUser,
} from "./mock-auth";

/**
 * Mock-only auth for the v1 demo.
 *
 * Clerk was removed in favour of a localStorage-backed mock flow so the entire
 * UX (sign-up → signed-in → dashboard → sign-out) works end-to-end with zero
 * external dependencies. When the backend partner wires real auth, they swap
 * MockAuthProvider for the real bridge — the `useAuth()` shape stays identical.
 */

// Compatibility flag — kept for components that still gate on it.
// Always false now: there is no real auth backend wired.
export const IS_CLERK_CONFIGURED = false;

// ────────────────────────────────────────────────────────────────────────────
// Auth context
// ────────────────────────────────────────────────────────────────────────────

export type SafeUser = {
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

const DEFAULT_STATE: AuthState = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
  isClerkConfigured: false,
  signOut: () => {},
};

const AuthContext = createContext<AuthState>(DEFAULT_STATE);

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

// ────────────────────────────────────────────────────────────────────────────
// Provider — localStorage-backed
// ────────────────────────────────────────────────────────────────────────────

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setUser(getMockUser());
    setIsLoaded(true);
    return onMockAuthChange(() => setUser(getMockUser()));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isLoaded,
      isSignedIn: !!user,
      isClerkConfigured: false,
      signOut: () => signOutMock(),
      user: user
        ? {
            firstName: user.firstName,
            fullName: user.fullName,
            email: user.email,
            imageUrl: user.imageUrl,
          }
        : null,
    }),
    [isLoaded, user]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// Aliases kept for previous import sites.
export const NoClerkAuthProvider = MockAuthProvider;
export const ClerkAuthBridge = MockAuthProvider;

// ────────────────────────────────────────────────────────────────────────────
// Declarative gate
// ────────────────────────────────────────────────────────────────────────────

export function AuthGate({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (when === "signed-in" && !isSignedIn) return null;
  if (when === "signed-out" && isSignedIn) return null;
  return <>{children}</>;
}
