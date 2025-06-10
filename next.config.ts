import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for better Azure deployment
  output: 'standalone',
  // Ensure experimental features work with Azure
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['prisma']
  }
}

export default nextConfig