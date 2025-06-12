/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for better debugging
  reactStrictMode: true,
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Compression
  compress: true,
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports - tree shaking for specific packages
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      'framer-motion',
      'recharts',
      '@supabase/auth-helpers-nextjs',
      'wagmi',
      'viem',
      '@coinbase/wallet-sdk'
    ],
    
    // Enable optimized font loading
    optimizeCss: true,
    
    // Reduce JavaScript size
    serverMinification: true,
    
    // Better server components
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Compiler options
  compiler: {
    // Remove console logs in production (keep errors and warnings)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    
    // Enable emotion optimization if you use it
    // emotion: true,
    
    // Enable styled-components optimization if you use it
    // styledComponents: true,
  },
  
  // Modularize imports for better tree shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
    'lodash': {
      transform: 'lodash/{{member}}',
    },
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // Preconnect to external domains
          {
            key: 'Link',
            value: '<https://fonts.googleapis.com>; rel=preconnect; crossorigin'
          }
        ]
      },
      // Aggressive caching for static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Service Worker
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      // API routes should not be cached
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ];
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'api.coingecko.com',
      'assets.coingecko.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      's3.tradingview.com',
      'via.placeholder.com'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Fix for wagmi/viem issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Fix for punycode deprecation warning
    config.resolve.alias = {
      ...config.resolve.alias,
      punycode: 'punycode/',
    };
    
    // Enable webpack 5 optimizations
    if (!dev && !isServer) {
      // Better minification
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunks
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Large libraries
            lib: {
              test(module) {
                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const hash = require('crypto').createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Common chunks
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Shared chunks
            shared: {
              name(module, chunks) {
                return 'shared-' + require('crypto')
                  .createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex')
                  .substring(0, 8);
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
        minimize: true,
      };
      
      // Enable long term caching
      config.optimization.realContentHash = true;
    }

    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/ai',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API proxying
  async rewrites() {
    return [
      {
        source: '/api/proxy/coingecko/:path*',
        destination: 'https://api.coingecko.com/api/v3/:path*',
      },
    ];
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Output configuration
  output: 'standalone',
  
  // Enable build cache
  cacheDirectory: '.next/cache',
  
  // Optimize builds
  optimizeFonts: true,
  
  // Bundle analyzer (uncomment to analyze bundle size)
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },
}

module.exports = nextConfig;