// components/theme-provider.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTheme } from "next-themes";

interface HeightsThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

const HeightsThemeContext = createContext<HeightsThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function HeightsThemeProvider({ children }: ThemeProviderProps) {
  const { theme: nextTheme, setTheme } = useTheme();
  const [theme, setCurrentTheme] = useState<string>("dark");
  
  // Sync with next-themes
  useEffect(() => {
    if (nextTheme) {
      setCurrentTheme(nextTheme);
    }
  }, [nextTheme]);
  
  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("heights-theme");
    if (savedTheme) {
      setTheme(savedTheme);
      setCurrentTheme(savedTheme);
    }
  }, [setTheme]);
  
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setCurrentTheme(newTheme);
    localStorage.setItem("heights-theme", newTheme);
  };
  
  const value = {
    theme,
    toggleTheme
  };
  
  return <HeightsThemeContext.Provider value={value}>{children}</HeightsThemeContext.Provider>;
}

export function useHeightsTheme() {
  const context = useContext(HeightsThemeContext);
  if (context === undefined) {
    throw new Error("useHeightsTheme must be used within a HeightsThemeProvider");
  }
  return context;
}