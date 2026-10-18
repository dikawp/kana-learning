import { z } from "zod"
import { ApiError } from "./api/errors"

const originSchema = z.string().url().refine((value) => {
  try {
    const url = new URL(value)
    return url.origin === value && (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
  } catch { return false }
})

export function authConfig(env: Record<string, string | undefined> = process.env) {
  const parsed = z.object({
    SUPABASE_URL: z.string().url().refine((value) => { try { const url = new URL(value); return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) } catch { return false } }),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1).refine((key) => {
      if (key.startsWith("sb_publishable_")) return true
      try { return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role === "anon" } catch { return false }
    }),
    APP_ORIGIN: originSchema,
  }).safeParse(env)
  if (!parsed.success) throw new ApiError(503, "AUTH_UNAVAILABLE", "Account services are not configured.")
  return { url: parsed.data.SUPABASE_URL, key: parsed.data.SUPABASE_PUBLISHABLE_KEY, origin: parsed.data.APP_ORIGIN }
}

export function isAuthConfigured() {
  try { authConfig(); return true } catch { return false }
}

export function databaseUrl(value = process.env.DATABASE_URL) {
  if (!value) throw new ApiError(503, "DATABASE_UNAVAILABLE", "Account storage is not configured.")
  try {
    const url = new URL(value)
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw Error()
    return { url: value, local: ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) }
  } catch { throw new ApiError(503, "DATABASE_UNAVAILABLE", "Account storage configuration is invalid.") }
}
