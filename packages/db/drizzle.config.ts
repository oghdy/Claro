import { defineConfig } from "drizzle-kit";

// 스키마(src/schema.ts) → SQL 을 만들 때만 쓴다 (`pnpm generate`). DB 에 연결하지 않는다 — 접속 값이 없다.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
});
