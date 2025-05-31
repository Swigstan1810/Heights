/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove the 'output: export' setting to use middleware
  // output: 'export', // This line should be removed or commented out
  images: {
    domains: ['images.unsplash.com'],
    // Remove unoptimized if not using export mode
  },
  env: {
    // Claude API Configuration
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
    CLAUDE_MAX_TOKENS: process.env.CLAUDE_MAX_TOKENS || '1000',
    CLAUDE_TEMPERATURE: process.env.CLAUDE_TEMPERATURE || '0.7',
  },
}

module.exports = nextConfig