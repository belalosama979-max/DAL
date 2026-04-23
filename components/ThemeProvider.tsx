"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "male" | "female";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "male",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Try to load theme from local storage if available
    const savedTheme = localStorage.getItem("dal-theme") as Theme;
    if (savedTheme && (savedTheme === "male" || savedTheme === "female")) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("dal-theme", newTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    // We only set the data-theme if it's female, otherwise we remove it (male is default)
    if (theme === "female") {
      root.setAttribute("data-theme", "female");
    } else {
      root.removeAttribute("data-theme");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
