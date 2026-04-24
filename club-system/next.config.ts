import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // السماح بأي صورة خارجية (مفيد للشعارات المرفوعة عبر URL)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
