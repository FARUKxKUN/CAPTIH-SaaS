"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { signInMock, signUpMock } from "@/lib/mock-auth";

type Mode = "sign-in" | "sign-up";

type AuthFormProps = {
  initialMode: Mode;
  redirectUrl: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Compact mock-auth form. Fits a 720p viewport without scrolling.
 * Sign In / Sign Up tabs, email (+ name on sign-up), Continue, social row,
 * terms footer — all in one viewport.
 */
export function AuthForm({ initialMode, redirectUrl }: AuthFormProps) {
  const router = useRouter();
  const emailId = useId();
  const nameId = useId();
  const passwordId = useId();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const trimmed = email.trim();
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!passwordValid) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      // Mock auth: any password is accepted. Real backend will validate.
      if (mode === "sign-up") {
        signUpMock({ email: trimmed, firstName: firstName.trim() });
      } else {
        signInMock(trimmed);
      }
      setTimeout(() => router.push(redirectUrl), 200);
    } catch {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  };

  const handleSocial = (provider: string) => {
    setError(
      `Demo mode · ${provider} sign-in coming once real auth is wired. Use email to continue.`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col">
      {/* Tabs */}
      <div className="mb-4 grid grid-cols-2 rounded-2xl border border-line bg-ink/40 p-1">
        <TabButton active={mode === "sign-in"} onClick={() => setMode("sign-in")}>
          Sign In
        </TabButton>
        <TabButton active={mode === "sign-up"} onClick={() => setMode("sign-up")}>
          Sign up
        </TabButton>
      </div>

      {/* Optional name field for sign-up */}
      {mode === "sign-up" && (
        <Field
          id={nameId}
          label="First name"
          icon={<UserIcon className="h-3.5 w-3.5" />}
          type="text"
          value={firstName}
          onChange={setFirstName}
          placeholder="What should we call you?"
          autoComplete="given-name"
        />
      )}

      {/* Email field */}
      <Field
        id={emailId}
        ref={emailRef}
        label="Email Address"
        icon={<MailIcon className="h-3.5 w-3.5" />}
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        valid={email.length > 0 && emailValid}
      />

      {/* Password field with show/hide toggle */}
      <Field
        id={passwordId}
        label="Password"
        icon={<LockIcon className="h-3.5 w-3.5" />}
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder={mode === "sign-up" ? "At least 6 characters" : "Your password"}
        autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        valid={passwordValid}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="rounded-md p-1 text-mute hover:text-bone"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        }
      />

      {/* Forgot password (sign-in only) — placeholder for now */}
      {mode === "sign-in" && (
        <button
          type="button"
          onClick={() =>
            setError(
              "Demo mode · password reset coming once real auth is wired."
            )
          }
          className="-mt-2 mb-2 self-end text-[11px] text-mute hover:text-bone"
        >
          Forgot password?
        </button>
      )}

      {/* Continue */}
      <button
        type="submit"
        disabled={busy || !canSubmit}
        className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-signal px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-signal/25 transition-all duration-200 ease-[var(--ease-spring)] enabled:hover:-translate-y-0.5 enabled:hover:shadow-signal/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "One sec…" : "Continue"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-2 rounded-xl border border-signal/30 bg-signal/5 px-3 py-1.5 text-[11px] text-signal"
        >
          {error}
        </p>
      )}

      {/* Or continue with */}
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
          Or Continue With
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <SocialButton label="Google" onClick={() => handleSocial("Google")}>
          <GoogleGlyph className="h-4 w-4" />
        </SocialButton>
        <SocialButton label="Apple" onClick={() => handleSocial("Apple")}>
          <AppleGlyph className="h-4 w-4" />
        </SocialButton>
        <SocialButton label="Facebook" onClick={() => handleSocial("Facebook")}>
          <FacebookGlyph className="h-4 w-4" />
        </SocialButton>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-mute">
        Join Tunisian creators on Captih. Trained on 100+ hrs of real darija.
        <br />
        <span className="font-arabic text-xs text-bone" dir="rtl">
          شكون غيري لي بش يفهمك؟
        </span>
      </p>

      <p className="mt-2 text-center text-[10px] text-mute">
        By continuing you agree to our{" "}
        <Link href="/legal/terms" className="link-metis text-bone">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/legal/privacy" className="link-metis text-bone">
          Privacy
        </Link>
      </p>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative rounded-xl py-2 text-sm font-medium transition-all duration-200 ease-[var(--ease-spring)] ${
        active
          ? "bg-surface text-bone shadow-sm"
          : "text-mute hover:text-bone"
      }`}
    >
      {children}
      {active && (
        <span
          className="absolute -bottom-1 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-signal"
          aria-hidden
        />
      )}
    </button>
  );
}

type FieldProps = {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: "text" | "email" | "password";
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  autoComplete?: string;
  valid?: boolean;
  /** Optional element rendered on the right side (e.g. show/hide password) */
  rightSlot?: React.ReactNode;
};

const Field = (function FieldComponent() {
  const Field = function Field(props: FieldProps & { ref?: React.Ref<HTMLInputElement> }) {
    const { id, label, icon, type, value, onChange, placeholder, autoComplete, valid, rightSlot, ref } = props;
    const hasRight = !!rightSlot || !!valid;
    return (
      <div className="mb-2.5">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" aria-hidden>
            {icon}
          </div>
          <div
            className={`relative rounded-xl border border-line bg-surface/60 pb-1.5 pl-10 pt-2 transition-colors focus-within:border-signal/60 ${
              hasRight ? "pr-10" : "pr-4"
            }`}
          >
            <label
              htmlFor={id}
              className="block font-mono text-[9px] uppercase tracking-wider text-mute"
            >
              {label}
            </label>
            <input
              ref={ref}
              id={id}
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              autoComplete={autoComplete}
              className="w-full bg-transparent text-sm text-bone outline-none placeholder:text-mute/50"
            />
          </div>
          {(rightSlot || valid) && (
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {valid && (
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-ok/15 text-ok"
                  aria-hidden
                >
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
              )}
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    );
  };
  Field.displayName = "AuthField";
  return Field;
})();

function SocialButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Continue with ${label}`}
      className="flex h-10 items-center justify-center rounded-xl border border-line bg-surface/60 text-bone transition-all duration-200 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-mute"
    >
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Icons
// ────────────────────────────────────────────────────────────────────────────

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}

function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.88 5.09A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a18 18 0 01-3.07 3.93M6.61 6.61A18 18 0 002 12s3.5 7 10 7c2.13 0 4.03-.75 5.63-1.85" />
      <path d="M3 3l18 18" />
      <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function GoogleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#EA4335" d="M12 5.04a6.96 6.96 0 014.99 1.94l3.74-3.74A11.93 11.93 0 0012 0 12 12 0 001.07 6.97l4.36 3.39A7.16 7.16 0 0112 5.04z" />
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 01-2.4 3.63l3.74 2.9c2.18-2.01 3.68-4.99 3.68-8.77z" />
      <path fill="#FBBC05" d="M5.43 14.36a7.16 7.16 0 010-4.72l-4.36-3.39A12 12 0 000 12c0 1.93.46 3.76 1.27 5.39l4.16-3.03z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.74-2.9c-1.04.7-2.36 1.13-4.2 1.13a7.16 7.16 0 01-6.71-4.96l-4.16 3.03A12 12 0 0012 24z" />
    </svg>
  );
}

function AppleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.05 12.04c0-3 2.47-4.45 2.58-4.52a5.65 5.65 0 00-4.44-2.4c-1.88-.2-3.67 1.1-4.62 1.1-.97 0-2.45-1.08-4.04-1.05A5.94 5.94 0 001.36 8.4c-2.16 3.75-.55 9.27 1.55 12.32 1.04 1.49 2.26 3.16 3.86 3.1 1.56-.06 2.15-1 4.03-1 1.88 0 2.4 1 4.05.97 1.67-.03 2.73-1.51 3.74-3 1.18-1.71 1.66-3.4 1.69-3.49-.04-.02-3.23-1.24-3.26-4.91M14.6 3.18a5.43 5.43 0 001.27-3.93 5.61 5.61 0 00-3.66 1.93 5.2 5.2 0 00-1.32 3.78c1.4.12 2.84-.7 3.71-1.78" />
    </svg>
  );
}

function FacebookGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.54-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
    </svg>
  );
}
