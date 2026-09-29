import { defineConfig } from "@playwright/test";

// 브라우저는 이 Mac 의 Chrome 을 쓴다 (playwright 브라우저 내려받기 없음)
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", channel: "chrome" },
  webServer: { command: "pnpm build && pnpm start", url: "http://localhost:3100", reuseExistingServer: false, timeout: 180_000 },
});
