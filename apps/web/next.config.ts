import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Workspace packages ship TypeScript source (no build step), so Next has to
  // compile them alongside the app.
  transpilePackages: ["@finlio/core", "@finlio/schemas", "@finlio/data", "@finlio/api"],
};

export default nextConfig;
