import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@studio/ui', '@studio/store', '@studio/database'],
    async rewrites() {
        return [
            {
                source: '/:any*',
                destination: '/',
            },
        ];
    },
};

export default nextConfig;
