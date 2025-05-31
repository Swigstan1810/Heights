"use client";
 
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { AIProvider } from "@/contexts/ai-context"; // Added AI context import
 
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ThemeProvider>
        <AuthProvider>
          <AIProvider>
            {children}
          </AIProvider>
        </AuthProvider>
      </ThemeProvider>
    </NextThemeProvider>
  );
}