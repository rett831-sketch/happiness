import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Let phones on the same Wi-Fi open the dev server via this computer's LAN address.
  allowedDevOrigins: ["192.168.0.100"],
  // Some apps and crawlers ask for /favicon.ico regardless of the <link> tags; serve the small icon.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon/32" }];
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
