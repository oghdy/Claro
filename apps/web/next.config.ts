import type { NextConfig } from "next";
import path from "node:path";

// 빌드 폴더를 용도마다 따로 둔다 — 테스트(.next-test) · 폰으로 보기(.next-phone) · 개발(.next) 이 서로의 빌드를 덮어쓰지 않게
const config: NextConfig = {
  distDir: process.env.CLARO_DIST ?? ".next",
  transpilePackages: ["@claro/contract", "@claro/db", "@claro/tokens"],
  // PGlite 는 wasm 을 제 폴더에서 읽는다 — 서버 묶음에 넣지 않는다 (개발 · 테스트용 데이터베이스. src/server/db.ts)
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: { root: path.join(import.meta.dirname, "../..") },
};

export default config;
