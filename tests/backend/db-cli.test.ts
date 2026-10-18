import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { expect, it } from "vitest"

it("loads the real Node/tsx database entrypoint and refuses undesignated targets before connecting", async () => {
  try {
    await promisify(execFile)(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/db/run.ts", "migrate"], {
      windowsHide: true, timeout: 20000,
      env: { ...process.env, APP_ENV: "production", DATABASE_CHANGE_TARGET: "", MIGRATION_DATABASE_URL: "", DATABASE_URL: "" },
    })
    throw Error("Unsafe migration entrypoint unexpectedly succeeded")
  } catch (error: unknown) {
    expect(error).toMatchObject({ code: 1, stderr: expect.stringContaining("Database command failed.") })
    expect(String((error as { stderr?: string }).stderr)).not.toContain("SyntaxError")
  }
})
