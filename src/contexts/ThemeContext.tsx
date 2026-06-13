"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Theme } from "@/types";

export const THEMES: Record<Theme, { label: string; icon: string }> = {
  dark:     { label: "Escuro",      icon: "🌙" },
  light:    { label: "Claro",       icon: "☀️" },
  violet:   { label: "Violeta",     icon: "✨" },
  midnight: { label: "Meia-noite",  icon: "⭐" },
  forest:   { label: "Floresta",    icon: "🌿" },
  rose:     { label: "Rosa",        icon: "🌸" },
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("sublime-theme") as Theme) || "dark";
    applyTheme(saved);
    setThemeState(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("sublime-theme", t);
  };

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
    setThemeState(t);
  }, []);

  const cycleTheme = useCallback(() => {
    const order = Object.keys(THEMES) as Theme[];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
