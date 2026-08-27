import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'i.ytimg.com' },
        ],
    },
};

export default nextConfig;
