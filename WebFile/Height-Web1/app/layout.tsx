import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/auth-context';
import { LoaderProvider } from '@/contexts/loader-context';
import { ErrorBoundary } from '@/lib/error-boundary';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Heights - Advanced Trading Platform',
  description: 'Professional trading platform with AI-powered insights, real-time market data, and comprehensive portfolio management.',
  keywords: 'trading, cryptocurrency, stocks, portfolio, AI, market analysis',
  robots: 'index, follow',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="dns-prefetch" href="//api.coinbase.com" />
        <link rel="dns-prefetch" href="//newsapi.org" />
        <link rel="dns-prefetch" href="//s3.tradingview.com" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <LoaderProvider>
                {children}
                <Toaster />
              </LoaderProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}