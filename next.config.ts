import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emits a self-contained server bundle so the container image stays small.
  output: "standalone",
  typedRoutes: false,
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Prisma 7's client is TS/WASM (no native engine binary to worry about),
  // but its runtime still isn't meant to go through the app bundler.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
