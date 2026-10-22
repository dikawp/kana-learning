import { databaseUrl } from "../../server/config"

export function migrationTarget(env: Record<string, string | undefined>) {
  if (!["disposable-development", "isolated-preview"].includes(env.DATABASE_CHANGE_TARGET ?? "") ||
    !["development", "test", "preview"].includes(env.APP_ENV ?? "") || env.VERCEL_ENV === "production") {
    throw Error("Database scripts require an explicit non-production disposable target.")
  }
  return databaseUrl(env.MIGRATION_DATABASE_URL ?? "")
}
