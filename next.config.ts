import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for better Azure deployment
  output: 'standalone',
  // External packages for server components
  serverExternalPackages: ['prisma']
}

export default nextConfig