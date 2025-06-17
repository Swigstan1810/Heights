"use client";
 
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { AIProvider } from "@/contexts/ai-context"; // Added AI context import
 
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <AIProvider>
          {children}
        </AIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}