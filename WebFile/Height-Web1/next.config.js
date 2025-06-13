/** @type {import('next').NextConfig} */
const crypto = require('crypto');

const nextConfig = {
  // Enable strict mode for better error handling
  reactStrictMode: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  transpilePackages: [
    '@radix-ui/react-progress',
    '@radix-ui/react-primitive',
    '@radix-ui/react-compose-refs',
    '@radix-ui/react-context',
    '@radix-ui/react-use-callback-ref',
    '@radix-ui/react-use-layout-effect'
  ],
  
  // Experimental features for optimization
  experimental: {
    // Enable optimized package imports for better tree shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-progress',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      'framer-motion',
      'recharts',
      '@supabase/auth-helpers-nextjs',
      'wagmi',
      'viem'
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
      'heightss.com',
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
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework chunks
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
            priority: 40,
            chunks: 'all',
          },
          // Lib chunk
          lib: {
            test(module) {
              return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          // Commons chunk
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          // Shared chunk
          shared: {
            name(module, chunks) {
              return crypto
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex') + (isServer ? '-server' : '');
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
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