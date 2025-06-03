import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Ensure proper port binding in production
    serverComponentsExternalPackages: []
  }
};

export default nextConfig;
