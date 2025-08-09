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
  // Add headers for CORS support
  async headers() {
    return [
      {
        // Apply comprehensive CORS headers to all API routes for HTTP and HTTPS
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-Forwarded-Proto, X-Forwarded-Host',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'false',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
          {
            key: 'Vary',
            value: 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;