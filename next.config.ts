import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Borramos swcMinify: true, de acá
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'fernlike-acclimatisable-magaly.ngrok-free.dev',
    'localhost:3000'
  ],
  serverExternalPackages: ["@afipsdk/afip.js"],
  turbopack: {},
};

export default withPWA(nextConfig);