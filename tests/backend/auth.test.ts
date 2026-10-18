import { randomUUID } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import type { CookieOptions } from "@supabase/ssr"
import { createCookieAuthClient } from "../../server/auth/client"
import { createSupabaseGateway } from "../../server/auth/gateway"
import { createApi } from "../../server/api/app"
import { callbackDestination } from "../../server/auth/callback"
import { authConfig, databaseUrl } from "../../server/config"

// Synthetic Auth protocol fixture, not usable credentials or a real Supabase project.
const fixtureUser = { id: randomUUID(), email: "learner@example.test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }
const config = { url: "https://auth-fixture.example.test", key: "synthetic-test-publishable-key" }
function harness(expired = false) {
  const jar = new Map<string, string>()
  const writes: Array<{ name: string; value: string; options: CookieOptions }> = []
  let rejectUser = false
  const token = (past: boolean) => `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: fixtureUser.id, exp: Math.floor(Date.now() / 1000) + (past ? -3600 : 3600) })).toString("base64url")}.synthetic-signature`
  const responseSession = (past: boolean) => ({ access_token: token(past), refresh_token: "synthetic-refresh-token", token_type: "bearer", expires_in: past ? -3600 : 3600, expires_at: Math.floor(Date.now() / 1000) + (past ? -3600 : 3600), user: fixtureUser })
  const transport = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url)
    const method = init?.method ?? "GET"
    if (url.pathname === "/auth/v1/token") return Response.json(responseSession(url.searchParams.get("grant_type") === "password" && expired))
    if (url.pathname === "/auth/v1/user" && method === "GET") return rejectUser ? Response.json({ message: "invalid token", code: "bad_jwt" }, { status: 401 }) : Response.json(fixtureUser)
    if (url.pathname === "/auth/v1/user" && method === "PUT") return Response.json(fixtureUser)
    if (url.pathname === "/auth/v1/signup") return Response.json({ user: fixtureUser, session: null })
    if (url.pathname === "/auth/v1/recover") return Response.json({})
    if (url.pathname === "/auth/v1/logout") return new Response(null, { status: 204 })
    throw Error(`Unexpected synthetic Auth request: ${url.pathname}`)
  })
  const client = () => createCookieAuthClient(config, {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll(values) {
      for (const cookie of values) {
        writes.push(cookie)
        if (cookie.options.maxAge === 0) jar.delete(cookie.name)
        else jar.set(cookie.name, cookie.value)
      }
    },
  }, true, transport)
  const gateway = () => createSupabaseGateway(client(), "https://kana.example.test")
  return { gateway, client, jar, writes, transport, reject: () => { rejectUser = true } }
}

describe("real Supabase SDK with isolated Auth transport", () => {
  it("uses HttpOnly session cookies, verifies getUser remotely on fresh requests and clears sign-out cookies", async () => {
    const test = harness()
    expect(await test.gateway().user()).toBeNull()
    await test.gateway().signIn(fixtureUser.email, "synthetic-password")
    expect(test.writes.some((entry) => entry.options.httpOnly && entry.options.secure && entry.options.sameSite === "lax")).toBe(true)
    expect(JSON.stringify([...test.jar.values()])).not.toContain("synthetic-password")
    expect(await test.gateway().user()).toEqual({ id: fixtureUser.id, email: fixtureUser.email })
    expect(test.transport.mock.calls.some(([input]) => String(input).endsWith("/auth/v1/user"))).toBe(true)
    await test.gateway().signOut()
    expect(test.writes.some((entry) => entry.options.maxAge === 0)).toBe(true)
    expect(await test.gateway().user()).toBeNull()
  })

  it("refreshes an expired cookie session via the SDK and writes replacement cookies", async () => {
    const test = harness(true)
    await test.gateway().signIn(fixtureUser.email, "synthetic-password")
    const previousWrites = test.writes.length
    expect(await test.gateway().user()).toEqual({ id: fixtureUser.id, email: fixtureUser.email })
    expect(test.transport.mock.calls.some(([input]) => String(input).includes("grant_type=refresh_token"))).toBe(true)
    expect(test.writes.length).toBeGreaterThan(previousWrites)
  })

  it("does not authorize a cookie's unverified user when Auth rejects the token", async () => {
    const test = harness()
    await test.gateway().signIn(fixtureUser.email, "synthetic-password")
    test.reject()
    const learning = vi.fn(async () => { throw Error("Database must not be reached") })
    const app = createApi({ auth: async () => test.gateway(), learning, origin: () => "https://kana.example.test", authConfigured: () => true })
    expect((await app.handle(new Request("https://kana.example.test/api/v1/me/progress"))).status).toBe(401)
    expect(learning).not.toHaveBeenCalled()
  })

  it("delegates signup/recovery/password changes with fixed safe redirects and supports sign-in errors", async () => {
    const test = harness()
    await test.gateway().signUp(fixtureUser.email, "synthetic-password")
    await test.gateway().recover(fixtureUser.email)
    await test.gateway().signIn(fixtureUser.email, "synthetic-password")
    await test.gateway().updatePassword("synthetic-new-password")
    const requests = test.transport.mock.calls.map(([input, init]) => ({ url: String(input), method: init?.method, body: String(init?.body ?? "") }))
    expect(requests.some((entry) => entry.url.includes("redirect_to=https%3A%2F%2Fkana.example.test%2Fauth%2Fcallback"))).toBe(true)
    expect(requests.some((entry) => entry.method === "PUT" && entry.body.includes("synthetic-new-password"))).toBe(true)
    test.transport.mockImplementation(async () => Response.json({ message: "invalid credentials", code: "invalid_credentials" }, { status: 400 }))
    await expect(test.gateway().signIn(fixtureUser.email, "synthetic-password")).rejects.toMatchObject({ code: "AUTH_FAILED" })
  })
})

describe("configuration and auth callback boundaries", () => {
  it("has no fabricated environment defaults and rejects unsafe URLs", () => {
    expect(() => authConfig({})).toThrow("not configured")
    expect(() => authConfig({ SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "", APP_ORIGIN: "" })).toThrow("not configured")
    expect(() => authConfig({ SUPABASE_URL: "https://synthetic.example.test", SUPABASE_PUBLISHABLE_KEY: "sb_secret_forbidden", APP_ORIGIN: "https://kana.example.test" })).toThrow("not configured")
    expect(() => authConfig({ SUPABASE_URL: "https://fixture.example.test", SUPABASE_PUBLISHABLE_KEY: "synthetic", APP_ORIGIN: "https://kana.example.test/untrusted" })).toThrow()
    expect(() => databaseUrl("https://not-postgres.example.test")).toThrow()
    expect(databaseUrl("postgres://test:test@127.0.0.1/kana_c2_test").local).toBe(true)
    for (const next of ["https://evil.test", "//evil.test", "/account/password?redirect=evil", null]) expect(callbackDestination(next)).toBe("/account")
    expect(callbackDestination("/account/password")).toBe("/account/password")
  })

  it("disables unconfigured accounts cleanly and requires authentication for password changes", async () => {
    const user = vi.fn(async () => null)
    const updatePassword = vi.fn(async () => {})
    const auth = { user, updatePassword, signIn: vi.fn(), signUp: vi.fn(), recover: vi.fn(), signOut: vi.fn() }
    const learning = async () => { throw Error("Not reached") }
    const app = createApi({ auth: async () => auth, learning, origin: () => "https://kana.example.test", authConfigured: () => false })
    const session = await app.handle(new Request("https://kana.example.test/api/v1/auth/session"))
    expect(await session.json()).toEqual({ configured: false, user: null })
    expect(user).not.toHaveBeenCalled()
    const password = await app.handle(new Request("https://kana.example.test/api/v1/auth/password", { method: "POST", headers: { origin: "https://kana.example.test", "content-type": "application/json" }, body: JSON.stringify({ password: "synthetic-password" }) }))
    expect(password.status).toBe(401)
    expect(updatePassword).not.toHaveBeenCalled()
  })
})
