import type { NextConfig } from "next";

const BACKEND_URL = 
  (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      { 
        // /api/ path will be forwarded as same origin
        source: "/api/:path*",
        // vercel server transfer it to the backend server-render
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  }
};

export default nextConfig;
