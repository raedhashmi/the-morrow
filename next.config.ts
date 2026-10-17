import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components stays off: every page renders dynamically per reader.
  cacheComponents: false,
  output: "standalone",
  serverExternalPackages: ["@react-pdf/renderer", "pg", "rss-parser"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default nextConfig;
