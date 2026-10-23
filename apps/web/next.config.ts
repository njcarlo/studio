import type { NextConfig } from 'next';
import path from 'path';

const monorepoRoot = path.resolve(__dirname, '../..');

const nextConfig: NextConfig = {
  output: process.env.BUILD_MOBILE === 'true' ? 'export' : 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: monorepoRoot,
  },
  serverExternalPackages: ["@apollo/server"],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  compress: true,
  transpilePackages: ["@studio/ui", "@studio/database", "@studio/store", "@studio/types", "@studio/graphql"],
  outputFileTracingRoot: monorepoRoot,
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.(png|jpg|jpeg|svg|webp|ico|woff|woff2|apk)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
