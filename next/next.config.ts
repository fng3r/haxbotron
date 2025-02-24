import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Match any path under /api
        destination: 'http://localhost:15001/api/:path*', // Redirect to your API server
      },
    ];
  },
};

export default nextConfig;
