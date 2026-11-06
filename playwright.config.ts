import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 5174;
const MOCK_PORT = 18788;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/support/mock-bmc.mjs",
      port: MOCK_PORT,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_BMC_PORT: String(MOCK_PORT) },
    },
    {
      command: `npx vite --port ${APP_PORT} --strictPort`,
      port: APP_PORT,
      reuseExistingServer: !process.env.CI,
      env: { CLUSTER_URL: `http://127.0.0.1:${MOCK_PORT}` },
    },
  ],
});
