import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { LoaderProvider } from '@/contexts/loader-context';
import { LoadingScreen } from '@/components/loading-screen';
import { ErrorBoundary } from '@/lib/error-boundary';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Heights - Advanced Trading Platform',
  description: 'Professional trading platform with AI-powered insights, real-time market data, and comprehensive portfolio management.',
  keywords: 'trading, cryptocurrency, stocks, portfolio, AI, market analysis',
  robots: 'index, follow',
  openGraph: {
    title: 'Heights Trading Platform',
    description: 'Professional trading platform with AI-powered insights',
    type: 'website',
    locale: 'en_US',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
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
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/images/logo.png" as="image" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//api.coinbase.com" />
        <link rel="dns-prefetch" href="//newsapi.org" />
        <link rel="dns-prefetch" href="//s3.tradingview.com" />
        
        {/* Preconnect to critical third parties */}
        <link rel="preconnect" href="https://api.coinbase.com" />
        <link rel="preconnect" href="https://s3.tradingview.com" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="dark">
            <AuthProvider>
              <LoaderProvider>
                <AppContent>{children}</AppContent>
                <Toaster />
              </LoaderProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// Separate component to use loader context
function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LoadingScreen 
        showProgress={true}
        showTasks={true}
        showStats={process.env.NODE_ENV === 'development'}
        theme="dark"
      />
      {children}
    </>
  );
}

// components/ui/loading-spinner.tsx - Reusable loading spinner
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {text && (
          <p className={cn(
            'text-muted-foreground',
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          )}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}