import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ceramic-studio",
  timeout: 45000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5178",
    headless: true,
    launchOptions: { channel: "chrome" },
  },
  webServer: {
    command: "npm run dev:studio",
    url: "http://127.0.0.1:5178",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
