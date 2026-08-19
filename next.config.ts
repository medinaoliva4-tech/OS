import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  experimental: {
    // Prisma's engine is a native binary; keep it external to the server bundle.
    serverActions: { bodySizeLimit: "4mb" },
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
