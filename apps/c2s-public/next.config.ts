import type { NextConfig } from 'next';
import path from 'path';

const monorepoRoot = path.resolve(__dirname, '../..');

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@studio/ui',
    '@studio/database',
    '@studio/core-engine',
    '@studio/c2s',
  ],
  outputFileTracingRoot: monorepoRoot,
  images: { unoptimized: true },
};

export default nextConfig;
