import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy: the page may only load and talk to this site. Even if a script were
// injected, it couldn't load code from elsewhere or send a visitor's key to another server
// (connect-src / img-src / form-action stop the usual ways out). Inline scripts stay allowed
// because Next.js needs them on these prerendered pages (nonces would force dynamic rendering).
// No upgrade-insecure-requests: the local preview is served over plain http on the LAN.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // the microphone is used by voice input; nothing else is needed
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Let phones on the same Wi-Fi open the dev server via this computer's LAN address.
  allowedDevOrigins: ["192.168.0.100", "192.168.0.102"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
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
