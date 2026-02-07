import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Erlaubt Server Actions von verschiedenen Origins (für Browser Preview)
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.localhost", "0.0.0.0"],
  // xlsx verwendet intern 'location' (Browser-API) → nicht bundlen, sondern zur Laufzeit laden
  serverExternalPackages: ["xlsx"],
};

export default nextConfig;
