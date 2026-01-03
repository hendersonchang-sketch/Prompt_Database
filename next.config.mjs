
/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: '/api/uploads/:path*',
            },
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        unoptimized: true,
    },
}

export default nextConfig;
