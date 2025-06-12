/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better error handling
  reactStrictMode: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Experimental features for optimization
  experimental: {
    // Enable optimized package imports for better tree shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      '@radix-ui/react-button',
      '@radix-ui/react-tabs',
      '@radix-ui/react-card',
      'framer-motion',
      'recharts'
    ],
    
    // Enable modern bundling
    esmExternals: true,
    
    // Enable turbo mode for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    
    // Enable SWC minification
    styledComponents: true,
  },
  
  // Enable compression
  compress: true,
  
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
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },
  
  // Configure images
  images: {
    domains: [
      'localhost', 
      'your-domain.com',
      'api.coingecko.com',
      'via.placeholder.com',
      'images.unsplash.com',
      'assets.coingecko.com'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 300, // 5 minutes
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Aggressive webpack optimization
  webpack: (config, { dev, isServer, webpack }) => {
    // Alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };

    // Production optimizations only
    if (!dev && !isServer) {
      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Custom splitChunks for maximum optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 60000, // Reduced from 80k
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
        cacheGroups: {
          // React core (highest priority)
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            chunks: 'all',
            priority: 30,
            enforce: true,
            reuseExistingChunk: true,
          },
          
          // Next.js core
          nextjs: {
            name: 'nextjs',
            test: /[\\/]node_modules[\\/]next[\\/]/,
            chunks: 'all',
            priority: 25,
            enforce: true,
            reuseExistingChunk: true,
          },
          
          // UI components (split into smaller chunks)
          radixUI: {
            name: 'radix-ui',
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            chunks: 'all',
            priority: 20,
            enforce: true,
            maxSize: 40000, // Smaller chunks
          },
          
          // Icons (separate chunk)
          icons: {
            name: 'icons',
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui\/react-icons)[\\/]/,
            chunks: 'all',
            priority: 18,
            enforce: true,
            maxSize: 30000,
          },
          
          // Supabase (essential but can be separate)
          supabase: {
            name: 'supabase',
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            chunks: 'all',
            priority: 15,
            enforce: true,
            maxSize: 50000,
          },
          
          // Charts (async loaded - these are heavy)
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            chunks: 'async',
            priority: 12,
            enforce: true,
            maxSize: 40000,
          },
          
          // Animation (async loaded)
          framerMotion: {
            name: 'framer-motion',
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            chunks: 'async',
            priority: 10,
            enforce: true,
            maxSize: 35000,
          },
          
          // Utilities
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](lodash|date-fns|clsx|class-variance-authority)[\\/]/,
            chunks: 'all',
            priority: 8,
            maxSize: 25000,
          },
          
          // Default vendor (smaller chunks)
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 5,
            enforce: true,
            maxSize: 30000,
            minChunks: 1,
          },
          
          // Common components (your own code)
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 3,
            reuseExistingChunk: true,
            maxSize: 25000,
          }
        }
      };

      // Module optimization
      config.optimization.moduleIds = 'deterministic';
      
      // Minimize bundle size
      config.optimization.minimize = true;
      
      // Remove source maps in production
      config.devtool = false;
      
      // Remove unused CSS
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss|sass)$/,
        chunks: 'all',
        enforce: true,
        priority: 20,
      };
    }

    // Ignore moment.js locales to reduce bundle size
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: true,
            reportFilename: 'bundle-analyzer-report.html',
          })
        );
      } catch (e) {
        console.log('Bundle analyzer not available');
      }
    }

    // Add Webpack rule to treat worker files as modules
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      type: 'javascript/auto',
    });

    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Output configuration
  output: 'standalone',
  
  // Enable SWC minification
  swcMinify: true,
  
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
  
  // Rewrites for API optimization
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://api.coingecko.com/api/v3/:path*',
      },
    ];
  },
}

module.exports = nextConfig;