import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Fix for Azure Web App URL issues
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL : undefined,
  basePath: process.env.NODE_ENV === 'production' ? '' : undefined,
  // Azure Web App stability settings
  experimental: {
    // Better caching for Azure
    scrollRestoration: true,
  },
  // Azure-specific optimizations
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
};

export default nextConfig;