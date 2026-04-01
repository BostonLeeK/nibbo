import type { NextConfig } from "next";

if (process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://homecrm:homecrm_local@127.0.0.1:5432/homecrm";
}

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/uploads/recipes/:filename",
        destination: "/api/recipes/image/:filename",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
