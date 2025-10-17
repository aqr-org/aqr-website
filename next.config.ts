import type { NextConfig } from "next";

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
};

export default nextConfig;
