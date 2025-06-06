import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Heights - Immersive Hybrid Trading Platform',
  description: 'Trade with confidence across global markets and crypto all from one unified platform.',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical meta tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Favicon and icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme and security */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />
        
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://s3.tradingview.com" />
        <link rel="preconnect" href="https://api.coinbase.com" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
        
        {/* Security headers for production */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* SEO and social */}
        <meta name="description" content="Trade with confidence across global markets and crypto all from one unified platform." />
        <meta name="keywords" content="trading, cryptocurrency, stocks, portfolio, investment, Heights" />
        <meta name="author" content="Heights Trading Platform" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Heights - Immersive Hybrid Trading Platform" />
        <meta property="og:description" content="Trade with confidence across global markets and crypto all from one unified platform." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Heights" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Heights - Immersive Hybrid Trading Platform" />
        <meta name="twitter:description" content="Trade with confidence across global markets and crypto all from one unified platform." />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <div id="root">
          <Providers>{children}</Providers>
        </div>
        
        {/* Production error boundary */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                console.error('Global error caught:', e.error);
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
              });
            `,
          }}
        />
      </body>
    </html>
  );
}