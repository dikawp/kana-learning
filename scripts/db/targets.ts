import { databaseUrl } from "../../server/config"

export function migrationTarget(env: Record<string, string | undefined>) {
  if (!["disposable-development", "isolated-preview"].includes(env.DATABASE_CHANGE_TARGET ?? "") ||
    !["development", "test", "preview"].includes(env.APP_ENV ?? "") || env.VERCEL_ENV === "production") {
    throw Error("Database scripts require an explicit non-production disposable target.")
  }
  return databaseUrl(env.MIGRATION_DATABASE_URL ?? "")
}

export function disposableTestTarget(env: Record<string, string | undefined>) {
  if (!env.C2_TEST_DATABASE_URL || env.C2_TEST_DATABASE_DISPOSABLE !== "yes-disposable" || env.APP_ENV === "production" || env.VERCEL_ENV === "production") {
    throw Error("An explicitly designated disposable network PostgreSQL database is required.")
  }
  let url: URL
  try { url = new URL(env.C2_TEST_DATABASE_URL) } catch { throw Error("Invalid disposable database URL; connection details are not logged.") }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !["localhost", "127.0.0.1"].includes(url.hostname) ||
    !/^\/kana_c2_test_[a-z0-9_]+$/.test(url.pathname) || url.search || url.hash) {
    throw Error("Only unambiguous loopback kana_c2_test_* database URLs are accepted.")
  }
  return url
}
