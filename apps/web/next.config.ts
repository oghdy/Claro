import type { NextConfig } from "next";
import path from "node:path";

// 빌드 폴더를 용도마다 따로 둔다 — 테스트(.next-test) · 폰으로 보기(.next-phone) · 개발(.next) 이 서로의 빌드를 덮어쓰지 않게
const config: NextConfig = {
  distDir: process.env.CLARO_DIST ?? ".next",
  transpilePackages: ["@claro/contract", "@claro/db", "@claro/tokens"],
  // PGlite 는 wasm 을 제 폴더에서 읽는다 — 서버 묶음에 넣지 않는다 (개발 · 테스트용 데이터베이스. src/server/db.ts)
  serverExternalPackages: ["@electric-sql/pglite"],
  // 배포(Vercel)의 서버 묶음에는 PGlite 와 마이그레이션 파일을 싣지 않는다 — 배포된 서버는 DATABASE_URL 로만 연다 (src/server/db.ts).
  // 기사 · 회차는 빌드할 때 정적 페이지에 실린다 (app/archive/fomc-2026-09/page.tsx · app/page.tsx · app/s) — 서버 묶음이 fixtures/ 를 읽을 일이 없다
  ...(process.env.VERCEL ? { outputFileTracingExcludes: { "/**": ["../../node_modules/.pnpm/@electric-sql+pglite*/**", "../../packages/db/migrations/**"] } } : {}),
  // F-E1 (D76): `/` 는 회차 형식의 첫 화면이 됐다. 옛 첫 화면 (9월 FOMC 기사)은 /archive/fomc-2026-09 로 옮겼다 —
  // 이미 나간 번호 링크 (`/?r=<UUID>` · D36 · D37)가 깨지지 않게 그리로 넘긴다 (?r= 는 그대로 따라간다). 번호 없는 `/` 는 새 첫 화면이다
  redirects: async () => [{ source: "/", has: [{ type: "query", key: "r" }], destination: "/archive/fomc-2026-09", permanent: false }],
  turbopack: { root: path.join(import.meta.dirname, "../..") },
};

export default config;
