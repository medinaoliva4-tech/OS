import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emits a self-contained server bundle so the container image stays small.
  output: "standalone",
  typedRoutes: false,
  experimental: {
    // Prisma's engine is a native binary; keep it external to the server bundle.
    serverActions: { bodySizeLimit: "4mb" },
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
