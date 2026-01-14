import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  compress: true,

  // Ignorar warnings do Supabase sobre Edge Runtime
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    // ⚠️ Apenas temporariamente se necessário
    ignoreBuildErrors: false,
  },

  // Experimental: usar Node.js runtime no middleware
  experimental: {
    // Se disponível na sua versão do Next.js
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.carolinecleaning.com" }],
        destination: "https://carolinecleaning.com/:path*",
        permanent: true,
      },
    ];
  },

  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default nextConfig;
