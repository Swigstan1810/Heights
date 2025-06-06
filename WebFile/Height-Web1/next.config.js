/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // REMOVED: output: 'standalone' - this was causing the npm start issue
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      }
    ],
  },
  // Handle punycode deprecation warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Suppress punycode warnings
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { file: /node_modules\/punycode/ }
    ];
    
    return config;
  },
  env: {
    // Claude API Configuration
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20241022',
    CLAUDE_MAX_TOKENS: process.env.CLAUDE_MAX_TOKENS || '1000',
    CLAUDE_TEMPERATURE: process.env.CLAUDE_TEMPERATURE || '0.7',
  },
}

module.exports = nextConfig