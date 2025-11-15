import type { NextConfig } from "next";

// Bundle analyzer configuration - only load when ANALYZE env var is set
let withBundleAnalyzer = (config: NextConfig) => config;
if (process.env.ANALYZE === 'true') {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bhmfxxloeuhdqpgnfweo.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'a.storyblok.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img2.storyblok.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'clipboard-read=*, clipboard-write=*',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
