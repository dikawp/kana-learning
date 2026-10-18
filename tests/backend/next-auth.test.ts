import { afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const fixture = vi.hoisted(() => ({
  exchange: vi.fn(), verify: vi.fn(), getUser: vi.fn(), create: vi.fn(),
}))
vi.mock("../../server/auth/supabase", () => ({ createAuthClient: async () => ({ auth: { exchangeCodeForSession: fixture.exchange, verifyOtp: fixture.verify } }) }))
vi.mock("@supabase/ssr", () => ({ createServerClient: (...args: unknown[]) => fixture.create(...args) }))
import { GET } from "../../app/auth/callback/route"
import { refreshSession } from "../../server/auth/refresh"

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
function config() {
  vi.stubEnv("SUPABASE_URL", "https://synthetic-auth.example.test")
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic_test_key")
  vi.stubEnv("APP_ORIGIN", "https://kana.example.test")
}

describe("Next Auth callback and refresh boundaries", () => {
  it("exchanges PKCE code then redirects only to an allowlisted local destination", async () => {
    config()
    fixture.exchange.mockResolvedValue({ error: null })
    const result = await GET(new NextRequest("https://kana.example.test/auth/callback?code=synthetic-code&next=https://evil.example.test"))
    expect(fixture.exchange).toHaveBeenCalledWith("synthetic-code")
    expect(result.status).toBe(303)
    expect(result.headers.get("location")).toBe("https://kana.example.test/account")
    expect(result.headers.get("cache-control")).toBe("private, no-store")
    expect(result.headers.get("referrer-policy")).toBe("no-referrer")
  })

  it("supports recovery token hashes and handles expired/unsupported links without exposing tokens", async () => {
    config()
    fixture.verify.mockResolvedValue({ error: null })
    const verified = await GET(new NextRequest("https://kana.example.test/auth/callback?token_hash=synthetic-hash&type=recovery&next=/account/password"))
    expect(fixture.verify).toHaveBeenCalledWith({ token_hash: "synthetic-hash", type: "recovery" })
    expect(verified.headers.get("location")).toBe("https://kana.example.test/account/password")
    fixture.exchange.mockResolvedValue({ error: Error("expired synthetic code") })
    const expired = await GET(new NextRequest("https://kana.example.test/auth/callback?code=expired-code"))
    expect(expired.headers.get("location")).toBe("https://kana.example.test/account?authError=link")
    const unsupported = await GET(new NextRequest("https://kana.example.test/auth/callback?token_hash=unknown&type=invite"))
    expect(unsupported.headers.get("location")).toBe("https://kana.example.test/account?authError=link")
    expect(fixture.verify).toHaveBeenCalledTimes(1)
  })

  it("propagates refreshed cookies to the Next request and uncached response", async () => {
    config()
    fixture.create.mockImplementation((_url: string, _key: string, options: { cookies: { setAll: (values: unknown[], headers: Record<string, string>) => void } }) => ({ auth: { getUser: async () => {
      fixture.getUser()
      options.cookies.setAll([{ name: "synthetic-session", value: "synthetic-new-token", options: { httpOnly: true, secure: true, sameSite: "lax", path: "/" } }], { "Cache-Control": "private, no-store", "Pragma": "no-cache", "Expires": "0" })
      return { data: { user: null }, error: null }
    } } }))
    const request = new NextRequest("https://kana.example.test/account")
    const response = await refreshSession(request)
    expect(fixture.getUser).toHaveBeenCalledOnce()
    expect(request.cookies.get("synthetic-session")?.value).toBe("synthetic-new-token")
    expect(response.cookies.get("synthetic-session")?.value).toBe("synthetic-new-token")
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("pragma")).toBe("no-cache")
  })

  it("leaves unconfigured guest-compatible environments usable without calling Auth", async () => {
    vi.stubEnv("SUPABASE_URL", "")
    const result = await refreshSession(new NextRequest("http://localhost:3000/account"))
    expect(result.status).toBe(200)
    expect(fixture.create).not.toHaveBeenCalled()
    expect(result.headers.get("cache-control")).toBe("private, no-store")
  })
})
