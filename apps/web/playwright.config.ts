import { defineConfig } from "@playwright/test";

// 브라우저는 이 Mac 의 Chrome 을 쓴다 (playwright 브라우저 내려받기 없음)
// 포트 · 빌드 폴더는 테스트 것을 따로 쓴다 (3101 · .next-test) — 개발 서버(3100) · 폰으로 보기(3200)와 같이 켜 둬도 겹치지 않는다
const PORT = 3101;
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome" },
  webServer: {
    // 원장도 테스트 것을 따로 쓴다 (.data/test — 매번 새로 만든다: 골든 한 판 + 테스트의 독자들). CLARO_PEEK: 테스트가 원장에 남은 것을 읽는다
    command: `tsx e2e/setup-db.ts && next build && next start -p ${PORT}`,
    env: { CLARO_DIST: ".next-test", CLARO_PGLITE_DIR: ".data/test", CLARO_PEEK: "1" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
