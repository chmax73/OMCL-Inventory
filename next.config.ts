import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Erlaubt Server Actions von verschiedenen Origins (für Browser Preview)
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
