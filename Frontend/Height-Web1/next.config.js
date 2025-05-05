
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
}

module.exports = nextConfig