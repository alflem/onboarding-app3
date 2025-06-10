import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for better Azure deployment
  output: 'standalone',
  // External packages for server components
  serverExternalPackages: ['prisma', '@prisma/client'],
  // Optimize bundle size
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  // Exclude source maps in production
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  }
}

export default nextConfig