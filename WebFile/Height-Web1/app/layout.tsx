// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { AsyncErrorBoundary } from '@/components/error-boundary';

import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: 'Heights - Professional Trading Platform',
  description: 'Trade cryptocurrencies, stocks, and mutual funds with real-time data and AI-powered insights.',
  keywords: 'trading, cryptocurrency, stocks, portfolio, investment, bitcoin, ethereum, trading platform',
  authors: [{ name: 'Heights Trading Platform' }],
  creator: 'Heights',
  publisher: 'Heights',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://heights.trading',
    siteName: 'Heights Trading Platform',
    title: 'Heights - Professional Trading Platform',
    description: 'Trade with confidence across global markets',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Heights Trading Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heights - Professional Trading Platform',
    description: 'Trade with confidence across global markets',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <head>
        {/* Critical meta tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.coinbase.com" />
        <link rel="preconnect" href="https://s3.tradingview.com" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL!} />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
        
        {/* PWA meta tags */}
        <meta name="application-name" content="Heights" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Heights" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body suppressHydrationWarning>
        <AsyncErrorBoundary>
          <Providers>
            <div id="root" className="min-h-screen">
              {children}
            </div>
          </Providers>
        </AsyncErrorBoundary>
        
        {/* Performance monitoring */}
        <Script
          id="performance-monitor"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Log Web Vitals
              if (typeof window !== 'undefined' && 'performance' in window) {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = window.performance.timing;
                    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                    const connectTime = perfData.responseEnd - perfData.requestStart;
                    const renderTime = perfData.domComplete - perfData.domLoading;
                    
                    console.log('Page Load Time:', pageLoadTime, 'ms');
                    console.log('Connect Time:', connectTime, 'ms');
                    console.log('Render Time:', renderTime, 'ms');
                    
                    // Send to analytics in production
                    if (window.location.hostname !== 'localhost') {
                      // Your analytics code here
                    }
                  }, 0);
                });
              }
            `,
          }}
        />
        
        {/* Global error handler */}
        <Script
          id="error-handler"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                console.error('Global error:', e.error);
                // Send to error tracking in production
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
                // Send to error tracking in production
              });
            `,
          }}
        />
      </body>
    </html>
  );
}