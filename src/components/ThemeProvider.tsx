"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
};

const STORAGE_KEY = "captih.theme";

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
});

/**
 * Reads the theme that the inline script (NoFlashThemeScript) already set on
 * <html data-theme="..."> and mirrors it into React state. New changes write
 * the attribute + localStorage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Pick up the value the inline script already applied
  useEffect(() => {
    if (typeof document === "undefined") return;
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "light" || current === "dark") {
      setThemeState(current);
    }
  }, []);

  const apply = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* quota / private mode — fall through */
    }
  }, []);

  const toggle = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [theme, apply]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Synchronous inline script — sets data-theme on <html> BEFORE React hydrates,
 * preventing the "flash of wrong theme" on first paint. Reads localStorage,
 * falls back to prefers-color-scheme, falls back to dark.
 */
export function NoFlashThemeScript({ nonce }: { nonce?: string }) {
  const code = `
    (function() {
      try {
        var key = ${JSON.stringify(STORAGE_KEY)};
        var stored = localStorage.getItem(key);
        var theme;
        if (stored === "light" || stored === "dark") {
          // Honor explicit user choice always
          theme = stored;
        } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
          // System dark-mode users get dark out of the box
          theme = "dark";
        } else {
          // Default for everyone else: light
          theme = "light";
        }
        document.documentElement.setAttribute("data-theme", theme);
      } catch (e) {
        document.documentElement.setAttribute("data-theme", "light");
      }
    })();
  `;
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
