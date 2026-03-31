import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://sunriseobx-api:8080";
    return [
      { source: "/auth/:path*", destination: `${apiUrl}/auth/:path*` },
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
    ];
  },
};

export default nextConfig;
