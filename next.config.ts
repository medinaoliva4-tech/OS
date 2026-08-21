import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emits a self-contained server bundle so the Docker image stays small.
  // Vercel builds its own serverless functions and does its own file
  // tracing — "standalone" output fights that and breaks the build with
  // "ENOENT .../next-server.js.nft.json". Only turn it on for the Docker
  // build (`process.env.VERCEL` is set automatically on Vercel's builders).
  output: process.env.VERCEL ? undefined : "standalone",
  typedRoutes: false,
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Prisma 7's client is TS/WASM (no native engine binary to worry about),
  // but its runtime still isn't meant to go through the app bundler.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
