/**
 * Clerk component styling to match Captih's "Studio Night" brand:
 * dark surfaces, parchment text, saffron accent.
 * Typed via the prop type of Clerk's components to avoid a direct
 * @clerk/types dependency.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#FF5C2B", // signal (saffron)
    colorBackground: "#16161C", // surface
    colorText: "#F4F1EA", // bone
    colorTextSecondary: "#8A857C", // mute
    colorInputBackground: "#0B0B0F", // ink
    colorInputText: "#F4F1EA",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full",
    card: "bg-surface border border-line shadow-none",
    headerTitle: "text-bone",
    headerSubtitle: "text-mute",
    socialButtonsBlockButton:
      "border-line text-bone hover:bg-ink/40",
    formFieldInput: "bg-ink border-line text-bone",
    formButtonPrimary:
      "bg-signal text-ink hover:bg-signal/90 normal-case",
    footerActionLink: "text-signal hover:text-signal/80",
    footer: "hidden",
  },
} as const;
