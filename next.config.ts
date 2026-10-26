import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server external packages if needed
  serverExternalPackages: ["@prisma/client", "prisma", "@electric-sql/pglite"],
};

export default nextConfig;
