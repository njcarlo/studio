import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@studio/ui', '@studio/store', '@studio/database'],
};

export default nextConfig;
