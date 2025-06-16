/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Enable standalone output for Docker
  output: 'standalone',
  // Experimental features for better Docker support
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
};

module.exports = nextConfig;