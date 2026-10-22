import { ApiError } from "./api/errors"

export function databaseUrl(value = process.env.DATABASE_URL) {
  if (!value) throw new ApiError(503, "DATABASE_UNAVAILABLE", "Learning material storage is not configured.")
  try {
    const url = new URL(value)
    if (!["postgres:", "postgresql:"].includes(url.protocol) || url.search || url.hash) throw Error()
    return { url: value, local: ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) }
  } catch { throw new ApiError(503, "DATABASE_UNAVAILABLE", "Learning material storage configuration is invalid.") }
}
