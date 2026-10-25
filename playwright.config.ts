import { defineConfig, devices } from "@playwright/test"
import fs from "node:fs"
const windowsChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe"
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
        (process.platform === "win32" && fs.existsSync(windowsChrome) ? windowsChrome : undefined),
    },
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3210",
    url: "http://127.0.0.1:3210",
    reuseExistingServer: false,
    timeout: 30000,
  },
})
