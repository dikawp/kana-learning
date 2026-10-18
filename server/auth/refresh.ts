import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { authConfig, isAuthConfigured } from "../config"

export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  response.headers.set("Cache-Control", "private, no-store")
  if (!isAuthConfigured()) return response
  const config = authConfig()
  const client = createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        for (const { name, value } of values) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of values) response.cookies.set(name, value, options)
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value)
        response.headers.set("Cache-Control", "private, no-store")
      },
    },
  })
  // Verification/refresh, never trust an unverified getSession user object.
  try { await client.auth.getUser() } catch {
    // UI/API will surface service availability; never manufacture an authenticated principal.
  }
  return response
}
