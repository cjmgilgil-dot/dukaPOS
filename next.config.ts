import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["pg", "pg-native", "@prisma/adapter-pg"],
};

export default nextConfig;
