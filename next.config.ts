/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: false
  },
  // Disable telemetry completely
  telemetry: false
}

module.exports = nextConfig