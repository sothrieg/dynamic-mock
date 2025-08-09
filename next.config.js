/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Enable static export for Netlify
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // Experimental features for better Docker support
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
};

module.exports = nextConfig;