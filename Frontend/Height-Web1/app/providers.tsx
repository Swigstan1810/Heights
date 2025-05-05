"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { HeightsThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <HeightsThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </HeightsThemeProvider>
    </ThemeProvider>
  );
}