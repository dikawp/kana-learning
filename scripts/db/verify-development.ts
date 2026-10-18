import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { createServer } from "node:net"
import { setTimeout as delay } from "node:timers/promises"
import nextEnv from "@next/env"
import postgres from "postgres"
import { authConfig, databaseUrl } from "../../server/config"
import { migrationTarget } from "./targets"
import { kanaData } from "../../lib/kana-data"

async function verifyHttp() {
  const reservation = createServer()
  reservation.listen(0, "127.0.0.1")
  await once(reservation, "listening")
  const address = reservation.address()
  assert.ok(address && typeof address !== "string")
  const port = address.port
  await new Promise<void>((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()))
  const origin = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, APP_ORIGIN: origin, MIGRATION_DATABASE_URL: "" },
  })
  child.stdout.resume(); child.stderr.resume()
  const exited = once(child, "exit")
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      assert.equal(child.exitCode, null, "Test server exited before readiness")
      try {
        const response = await fetch(`${origin}/api/v1/health`, { signal: AbortSignal.timeout(1000) })
        if (response.ok) { assert.deepEqual(await response.json(), { authConfigured: true }); ready = true; break }
      } catch { /* Bounded startup retry, no external mutations. */ }
      await delay(100)
    }
    assert.ok(ready, "Test server did not become ready")
    const request = (path: string, init?: RequestInit) => fetch(`${origin}/api/v1${path}`, { ...init, signal: AbortSignal.timeout(15000) })
    const content = await request("/content/kana")
    assert.equal(content.status, 200)
    assert.deepEqual((await content.json()).items, kanaData)
    assert.match(content.headers.get("cache-control") ?? "", /private.*no-store/)
    const session = await request("/auth/session")
    assert.equal(session.status, 200)
    assert.deepEqual(await session.json(), { configured: true, user: null })
    const denied = await request("/me/progress")
    assert.equal(denied.status, 401)
    assert.equal((await denied.json()).error.code, "UNAUTHENTICATED")
    const invalid = await request("/me/progress", { method: "PUT", headers: { origin, "content-type": "application/json" }, body: "{}" })
    assert.equal(invalid.status, 422)
    const csrf = await request("/me/progress/reset", { method: "POST", headers: { origin: "https://untrusted.example.test", "content-type": "application/json" }, body: "{}" })
    assert.equal(csrf.status, 403)
    assert.equal((await csrf.json()).error.code, "ORIGIN_REJECTED")
    console.info("Hosted Next/Elysia HTTP passed: database-backed kana, configured session, anonymous/validation/origin boundaries. No account writes or emails.")
  } finally { child.kill(); await exited }
}

// Explicit, read-only hosted development checks. Never reset or create Auth users.
async function main() {
  nextEnv.loadEnvConfig(process.cwd())
  const admin = new URL(migrationTarget(process.env).url)
  const auth = authConfig()
  const runtime = databaseUrl()
  const target = new URL(runtime.url)
  const reference = new URL(auth.url).hostname.split(".")[0]
  assert.equal(process.env.APP_ENV, "development")
  assert.equal(process.env.DATABASE_CHANGE_TARGET, "disposable-development")
  assert.ok(new URL(auth.url).hostname.endsWith(".supabase.co"))
  assert.equal(target.hostname, admin.hostname)
  assert.equal(target.pathname, admin.pathname)
  assert.equal(admin.username, `postgres.${reference}`)
  assert.equal(target.username, `kana_app.${reference}`)
  assert.ok(target.hostname.endsWith(".pooler.supabase.com"))
  assert.equal(target.port, "6543")
  assert.equal(target.search, "")
  const pool = postgres(runtime.url, { max: 4, prepare: false, ssl: "require", connect_timeout: 10, connection: { statement_timeout: 10000 } })
  try {
    await pool.begin("read only", async (connection) => {
      const [mode] = await connection`show transaction_read_only`
      assert.equal(mode.transaction_read_only, "on")
      const [role] = await connection`select current_user as name, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole from pg_roles where rolname=current_user`
      assert.equal(role.name, "kana_app")
      for (const key of ["rolsuper", "rolbypassrls", "rolcreatedb", "rolcreaterole"]) assert.equal(role[key], false)
      const content = await connection`select id, character, romaji, type, category from learning.kana order by position`
      assert.deepEqual([...content], kanaData)
      const policies = await connection`select c.relname, c.relrowsecurity, c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='learning' and c.relkind='r'`
      assert.equal(policies.length, 7)
      for (const table of policies) { assert.equal(table.relrowsecurity, true); assert.equal(table.relforcerowsecurity, true) }
      const [privileges] = await connection`select has_table_privilege(current_user, 'learning.kana', 'UPDATE') as edit_content, has_table_privilege(current_user, 'learning.quiz_answers', 'UPDATE') as edit_answers, has_schema_privilege(current_user, 'learning', 'CREATE') as ddl`
      assert.deepEqual(privileges, { edit_content: false, edit_answers: false, ddl: false })
      for (const table of ["profiles", "kana_familiarity", "quiz_sessions", "quiz_questions", "quiz_answers", "mutation_receipts"]) {
        // Identifiers come only from this literal allowlist, never external input.
        const [row] = await connection.unsafe(`select count(*)::int as count from learning.${table}`)
        assert.equal(row.count, 0, "RLS must deny reads without an account claim")
      }
    })
    await assert.rejects(pool.begin("read only", (connection) => connection`select count(*) from auth.users`), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "42501")
    const parallel = await Promise.all(Array.from({ length: 4 }, () => pool.begin("read only", (connection) => connection`select count(*)::int as count from learning.kana`)))
    assert.ok(parallel.every(([row]) => row.count === 208))
    console.info("Hosted SQL passed: 208 exact kana, restricted pooled LOGIN, forced RLS, denied Auth access, parallel reads. No rows changed.")
  } finally { await pool.end() }
  const settings = await fetch(`${auth.url}/auth/v1/settings`, { headers: { apikey: auth.key }, signal: AbortSignal.timeout(15000) })
  assert.equal(settings.status, 200)
  const body = await settings.json()
  assert.equal(body.external?.email, true)
  assert.equal(body.disable_signup, false)
  console.info("Hosted Auth settings passed: publishable key accepted, email provider and sign-up enabled. Delivery and authenticated flows are not claimed.")
  await verifyHttp()
}

main().catch(() => { console.error("Hosted development verification failed. Check configuration/roles/schema; secrets and provider responses are not logged."); process.exitCode = 1 })
