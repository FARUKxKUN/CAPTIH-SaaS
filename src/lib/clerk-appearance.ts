/**
 * Clerk component styling to match Captih's brand and the original custom auth form.
 * Colors use the theme CSS tokens (--c-*) so the form follows light/dark like the
 * rest of the site (cream in light mode, Studio Night in dark).
 * Typed loosely (as const) — Clerk's Appearance prop accepts this shape.
 */
export const clerkAppearance = {
  layout: {
    // Match the old form: fields first, then "OR CONTINUE WITH" + a row of social icons.
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "iconButton",
    showOptionalFields: true,
  },
  variables: {
    colorPrimary: "var(--c-signal)",
    colorBackground: "var(--c-surface)",
    colorText: "var(--c-bone)",
    colorTextSecondary: "var(--c-mute)",
    colorInputBackground: "var(--c-ink)",
    colorInputText: "var(--c-bone)",
    colorInputBorder: "var(--c-line)",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full",
    // No Clerk card chrome — AuthLayout provides the frame, form sits flush like the mock.
    card: "bg-transparent border-0 shadow-none p-0 gap-4 w-full",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    formFieldLabel:
      "font-mono text-[10px] uppercase tracking-[0.18em] text-mute",
    formFieldInput:
      "bg-ink border border-line text-bone rounded-xl placeholder:text-mute/60",
    formButtonPrimary:
      "bg-signal text-ink hover:bg-signal/90 normal-case rounded-full py-3 font-medium",
    dividerLine: "bg-line",
    dividerText:
      "font-mono text-[10px] uppercase tracking-[0.18em] text-mute",
    socialButtons: "flex gap-3",
    socialButtonsIconButton:
      "flex-1 border border-line rounded-xl py-3 hover:bg-ink/40",
    footer: "hidden",
    footerAction: "hidden",
  },
} as const;

/**
 * Field copy to match the old mock ("What should we call you?", "you@example.com").
 * First-name field only renders if "Name" collection is enabled in the Clerk dashboard.
 */
export const clerkLocalization = {
  formButtonPrimary: "Continue",
  dividerText: "or continue with",
  formFieldLabel__firstName: "First name",
  formFieldLabel__emailAddress: "Email address",
  formFieldInputPlaceholder__firstName: "What should we call you?",
  formFieldInputPlaceholder__emailAddress: "you@example.com",
} as const;
