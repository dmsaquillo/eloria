import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.6"],

  cacheComponents: true,
  partialPrefetching: true,

  // Allow higher image quality (used by quality={90} in the dashboard)
  images: {
    qualities: [75, 90, 100],
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;