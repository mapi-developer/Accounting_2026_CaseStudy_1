// frontend/next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',

  turbopack: {
    resolveAlias: {
      // Point to the physical empty file to satisfy TS types
      'canvas': './empty-shim.js',
    },
  },

  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;