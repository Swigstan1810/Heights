// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Heights - Decentralized Crypto Trading",
  description: "Trade cryptocurrencies with your decentralized wallet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <AuthProvider>
            <WalletProvider>
              {children}
              <Toaster position="top-right" richColors />
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}