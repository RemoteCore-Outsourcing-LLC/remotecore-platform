import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CSS goes inside the page, so phones paint without waiting for a separate CSS file.
  experimental: { inlineCss: true },
};

export default nextConfig;
