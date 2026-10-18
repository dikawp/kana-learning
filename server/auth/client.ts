import "server-only"
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr"

export function createCookieAuthClient(config: { url: string; key: string }, cookies: CookieMethodsServer, secure: boolean, transport?: typeof fetch) {
  return createServerClient(config.url, config.key, {
    cookies,
    cookieOptions: { httpOnly: true, sameSite: "lax", secure, path: "/" },
    ...(transport ? { global: { fetch: transport } } : {}),
  })
}
