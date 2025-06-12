/** @type {import('next').NextConfig} */
// @ts-ignore
// import type { Configuration } from 'webpack';

const nextConfig = {
  // Enable strict mode for better error handling
  reactStrictMode: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Experimental features for aggressive optimization
  experimental: {
    // Enable optimizations
    optimizeCss: false, // Keep disabled due to critters issues
    
    // Aggressively optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      '@radix-ui/react-button',
      'react-hook-form',
    ],
    
    // Enable modern bundling
    esmExternals: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Security headers
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
          }
        ]
      }
    ];
  },
  
  // Configure images
  images: {
    domains: ['localhost', 'your-domain.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Aggressive webpack optimization
  webpack: (config: any, { dev, isServer, webpack }: any) => {
    // Alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };

    // Production optimizations only
    if (!dev && !isServer) {
      // Aggressive tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Custom splitChunks for maximum optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 0,
        maxSize: 100000, // Force splitting at 100kb
        minChunks: 1,
        cacheGroups: {
          // React and core libraries - smallest chunk
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          
          // Next.js internals
          nextjs: {
            name: 'nextjs',
            test: /[\\/]node_modules[\\/]next[\\/]/,
            chunks: 'all',
            priority: 19,
            enforce: true,
          },
          
          // UI Framework (split by library)
          radixUI: {
            name: 'radix-ui',
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            chunks: 'all',
            priority: 18,
            enforce: true,
          },
          
          // Icons separately
          icons: {
            name: 'icons',
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui\/react-icons)[\\/]/,
            chunks: 'all',
            priority: 17,
            enforce: true,
          },
          
          // Animation libraries
          framerMotion: {
            name: 'framer-motion',
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            chunks: 'all',
            priority: 16,
            enforce: true,
          },
          
          // Charts and data visualization
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
          
          // Utilities
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](lodash|date-fns|clsx|class-variance-authority)[\\/]/,
            chunks: 'all',
            priority: 14,
            enforce: true,
          },
          
          // Form libraries
          forms: {
            name: 'forms',
            test: /[\\/]node_modules[\\/](react-hook-form|@hookform)[\\/]/,
            chunks: 'all',
            priority: 13,
            enforce: true,
          },
          
          // HTTP and API libraries
          api: {
            name: 'api',
            test: /[\\/]node_modules[\\/](axios|swr|@tanstack)[\\/]/,
            chunks: 'all',
            priority: 12,
            enforce: true,
          },
          
          // Everything else vendor
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10,
            enforce: true,
            maxSize: 50000, // Split vendor if it gets too big
          },
          
          // Common shared code between your pages
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            maxSize: 30000,
          }
        }
      };

      // Further optimizations
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
      
      // Remove source maps completely
      config.devtool = false;
    }

    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: true,
          })
        );
      } catch (e) {
        console.log('Bundle analyzer not available');
      }
    }

    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Output configuration
  output: 'standalone',
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/home',
        permanent: true,
      },
    ];
  },
}

export {}

module.exports = nextConfig;