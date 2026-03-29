// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this webpack configuration to ignore the canvas module
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;