import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)), "server-only": fileURLToPath(new URL("./tests/backend/server-only.ts", import.meta.url)) } },
  test: { environment: "node", include: ["tests/backend/**/*.test.ts"], fileParallelism: false, maxWorkers: 1, testTimeout: 30000, hookTimeout: 60000, restoreMocks: true },
})
