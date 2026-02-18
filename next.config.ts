import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Erlaubt Server Actions von verschiedenen Origins (für Browser Preview)
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.localhost", "0.0.0.0", "127.0.0.1:61572"],
  // xlsx verwendet intern 'location' (Browser-API) → nicht bundlen, sondern zur Laufzeit laden
  serverExternalPackages: ["xlsx"],
  // Body Size Limit für Server Actions erhöhen (Standard: 1MB, zu klein für grosse Excel-Dateien)
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
