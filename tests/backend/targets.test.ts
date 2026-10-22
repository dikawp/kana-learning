import { expect, it } from "vitest"
import { migrationTarget } from "../../scripts/db/targets"
import { databaseUrl } from "../../server/config"

it("refuses production/ambiguous database targets without a runtime-credential fallback", () => {
  const url = "postgres://synthetic:synthetic@127.0.0.1/content_test"
  expect(() => migrationTarget({})).toThrow()
  expect(() => migrationTarget({ DATABASE_CHANGE_TARGET: "disposable-development", APP_ENV: "production", MIGRATION_DATABASE_URL: url })).toThrow()
  expect(() => migrationTarget({ DATABASE_CHANGE_TARGET: "disposable-development", APP_ENV: "development", VERCEL_ENV: "production", MIGRATION_DATABASE_URL: url })).toThrow()
  expect(() => migrationTarget({ DATABASE_CHANGE_TARGET: "disposable-development", APP_ENV: "development", DATABASE_URL: url })).toThrow()
  expect(migrationTarget({ DATABASE_CHANGE_TARGET: "disposable-development", APP_ENV: "development", MIGRATION_DATABASE_URL: url }).local).toBe(true)
  for (const invalid of ["", "https://example.test", url + "?host=other", url + "#fragment"]) expect(() => databaseUrl(invalid)).toThrow()
})
