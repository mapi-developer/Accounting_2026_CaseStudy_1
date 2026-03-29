// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables a highly optimized production build for Docker
  output: 'standalone',

  // Silences the Turbopack vs Webpack warning
  turbopack: {},

  // Forces the bundler to ignore the 'canvas' module in all environments
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;