"use client";

/**
 * Mock authentication for local demo + dev.
 * Stores a fake user in localStorage. Any email/password is accepted.
 *
 * Used by useAuth() when Clerk isn't configured — so the entire app behaves
 * exactly as if real auth is wired (modal gates, dashboard, sign-out, etc.)
 * without needing a Clerk account or backend.
 *
 * When Faruk's partner wires real Clerk auth, this is bypassed — real auth wins.
 */

export type MockUser = {
  readonly email: string;
  readonly firstName: string;
  readonly fullName: string | null;
  readonly imageUrl: string | null;
  readonly createdAt: string;
};

const STORAGE_KEY = "captih.mock-user.v1";
const EVENT_NAME = "captih:mock-auth-changed";

function safeRead(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

function safeWrite(user: MockUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function getMockUser(): MockUser | null {
  return safeRead();
}

export function signUpMock({
  email,
  firstName,
}: {
  email: string;
  firstName?: string;
}): MockUser {
  const safeFirst =
    (firstName?.trim() || email.split("@")[0] || "creator").slice(0, 40);
  const user: MockUser = {
    email: email.toLowerCase().trim(),
    firstName: safeFirst,
    fullName: firstName?.trim() || null,
    imageUrl: null,
    createdAt: new Date().toISOString(),
  };
  safeWrite(user);
  return user;
}

export function signInMock(email: string): MockUser {
  const existing = safeRead();
  if (existing && existing.email === email.toLowerCase().trim()) {
    return existing;
  }
  // Demo behaviour: any email "works" — create the user record on the fly
  return signUpMock({ email });
}

export function signOutMock(): void {
  safeWrite(null);
}

/**
 * Subscribe to mock auth state changes (across tabs too).
 * Returns an unsubscribe function.
 */
export function onMockAuthChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", onStorage);
  };
}
