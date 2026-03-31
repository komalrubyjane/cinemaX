import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://127.0.0.1:5001/api/:path*",
      },
      {
        source: "/api/ai/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/recommend/:path*",
        destination: "http://127.0.0.1:8000/recommend/:path*",
      },
    ];
  },
};

export default nextConfig;
