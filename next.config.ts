import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Fix for Azure Web App URL issues
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL : undefined,
  basePath: process.env.NODE_ENV === 'production' ? '' : undefined,
};

export default nextConfig;