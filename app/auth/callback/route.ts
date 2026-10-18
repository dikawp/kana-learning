import { NextRequest, NextResponse } from "next/server"
import { createAuthClient } from "@/server/auth/supabase"
import { authConfig } from "@/server/config"
import { callbackDestination } from "@/server/auth/callback"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" }
  try {
    const client = await createAuthClient()
    const code = request.nextUrl.searchParams.get("code")
    const hash = request.nextUrl.searchParams.get("token_hash")
    const type = request.nextUrl.searchParams.get("type")
    const result = code
      ? await client.auth.exchangeCodeForSession(code)
      : hash && (type === "signup" || type === "recovery")
        ? await client.auth.verifyOtp({ token_hash: hash, type })
        : null
    const path = result && !result.error ? callbackDestination(request.nextUrl.searchParams.get("next")) : "/account?authError=link"
    return NextResponse.redirect(new URL(path, authConfig().origin), { status: 303, headers })
  } catch {
    return NextResponse.json({ error: { code: "AUTH_LINK_FAILED", message: "Account link could not be verified. Request a new link.", requestId: crypto.randomUUID() } }, { status: 503, headers })
  }
}
