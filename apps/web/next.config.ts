import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  transpilePackages: ["@claro/contract"],
  turbopack: { root: path.join(import.meta.dirname, "../..") },
};

export default config;
