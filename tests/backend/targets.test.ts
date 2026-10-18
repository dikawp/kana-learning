import { expect, it } from "vitest"
import { migrationTarget, disposableTestTarget } from "../../scripts/db/targets"

it("refuses production or ambiguous database targets before opening a connection", () => {
  const url = "postgres://synthetic:synthetic@127.0.0.1/kana_c2_test_fixture"
  expect(() => migrationTarget({})).toThrow()
  expect(() => migrationTarget({ DATABASE_CHANGE_TARGET: "disposable-development", APP_ENV: "production", MIGRATION_DATABASE_URL: url })).toThrow()
  expect(() => migrationTarget({ DATABASE_CHANGE_TARGET: "disposable-development", APP_ENV: "development", VERCEL_ENV: "production", MIGRATION_DATABASE_URL: url })).toThrow()
  expect(() => migrationTarget({ DATABASE_CHANGE_TARGET: "disposable-development", APP_ENV: "development", DATABASE_URL: url })).toThrow()
  expect(migrationTarget({ DATABASE_CHANGE_TARGET: "disposable-development", APP_ENV: "development", MIGRATION_DATABASE_URL: url }).local).toBe(true)
  const designated = { C2_TEST_DATABASE_DISPOSABLE: "yes-disposable", C2_TEST_DATABASE_URL: url }
  expect(disposableTestTarget(designated).hostname).toBe("127.0.0.1")
  for (const invalid of ["postgres://synthetic:synthetic@db.example.test/kana_c2_test_fixture", "postgres://synthetic:synthetic@127.0.0.1/production", `${url}?host=db.example.test`, `${url}#fragment`, "http://127.0.0.1/kana_c2_test_fixture"]) {
    expect(() => disposableTestTarget({ ...designated, C2_TEST_DATABASE_URL: invalid })).toThrow()
  }
  expect(() => disposableTestTarget({ ...designated, VERCEL_ENV: "production" })).toThrow()
})
