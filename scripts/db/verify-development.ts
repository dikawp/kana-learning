import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { createServer } from "node:net"
import { setTimeout as delay } from "node:timers/promises"
import nextEnv from "@next/env"
import postgres from "postgres"
import { databaseUrl } from "../../server/config"
import { migrationTarget } from "./targets"
import { assertContentRole, runtimeAccessSql } from "../../server/db/access"
import { contentSchema } from "../../lib/content/contracts"
import { kanaData } from "../../lib/kana-data"

async function verifyHttp() {
  const reservation = createServer()
  reservation.listen(0, "127.0.0.1")
  await once(reservation, "listening")
  const address = reservation.address()
  assert.ok(address && typeof address !== "string")
  const port = address.port
  await new Promise<void>((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()))
  const origin = "http://127.0.0.1:" + port
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, MIGRATION_DATABASE_URL: "" },
  })
  child.stdout.resume(); child.stderr.resume()
  const exited = once(child, "exit")
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      assert.equal(child.exitCode, null, "Test server exited before readiness")
      try {
        const response = await fetch(origin + "/api/v1/health", { signal: AbortSignal.timeout(1000) })
        if (response.ok) { assert.deepEqual(await response.json(), { contentConfigured: true, liveDependencyCheck: false }); ready = true; break }
      } catch { /* bounded startup retry */ }
      await delay(100)
    }
    assert.ok(ready, "Test server did not become ready")
    const response = await fetch(origin + "/api/v1/content/kana", { signal: AbortSignal.timeout(15000) })
    assert.equal(response.status, 200)
    assert.deepEqual(contentSchema.parse(await response.json()).items, kanaData)
    assert.equal(response.headers.get("set-cookie"), null)
    assert.match(response.headers.get("cache-control") ?? "", /public.*must-revalidate/)
    const cached = await fetch(origin + "/api/v1/content/kana", { headers: { "if-none-match": response.headers.get("etag")! } })
    assert.equal(cached.status, 304)
    for (const path of ["/account", "/account/password", "/auth/callback", "/api/v1/auth/session", "/api/v1/me/progress", "/api/v1/quiz-sessions"]) {
      assert.equal((await fetch(origin + path)).status, 404)
    }
    console.info("Hosted Next/Elysia passed: 208 SQL-backed kana, revision/ETag, anonymous content, removed learner routes404, no cookies.")
  } finally { if (child.exitCode === null) child.kill(); await exited }
}

async function main() {
  nextEnv.loadEnvConfig(process.cwd())
  const admin = new URL(migrationTarget(process.env).url)
  const runtime = databaseUrl()
  const target = new URL(runtime.url)
  assert.equal(process.env.APP_ENV, "development")
  assert.equal(process.env.DATABASE_CHANGE_TARGET, "disposable-development")
  assert.equal(target.hostname, admin.hostname)
  assert.equal(target.pathname, admin.pathname)
  assert.ok(target.hostname.endsWith(".pooler.supabase.com"))
  const reference = admin.username.split(".").slice(1).join(".")
  assert.ok(reference && admin.username === "postgres." + reference)
  assert.equal(target.username, "kana_app." + reference)
  assert.equal(target.port, "6543")
  const pool = postgres(runtime.url, { max: 4, prepare: false, ssl: "require", connect_timeout: 10 })
  try {
    await pool.begin("read only", async (connection) => {
      assert.equal((await connection`show transaction_read_only`)[0].transaction_read_only, "on")
      const roles = await connection.unsafe<{ rolsuper: boolean; rolbypassrls: boolean; ddl: boolean; unsafe_grants: boolean }[]>(runtimeAccessSql)
      assertContentRole(roles)
      const rows = await connection`select id,character,romaji,type,category from learning.kana order by position`
      assert.deepEqual([...rows], kanaData)
      const policies = await connection`select relrowsecurity,relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='learning' and c.relname='kana'`
      assert.equal(policies.length, 1)
      assert.ok(policies[0].relrowsecurity && policies[0].relforcerowsecurity)
    })
    for (const table of ["profiles", "kana_familiarity", "quiz_sessions", "quiz_questions", "quiz_answers", "mutation_receipts"]) {
      await assert.rejects(pool.begin("read only", (connection) => connection.unsafe("select * from learning." + table + " limit 0")),
        (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "42501")
    }
    const parallel = await Promise.all(Array.from({ length: 4 }, () => pool.begin("read only", (connection) => connection`select count(*)::int as count from learning.kana`)))
    assert.ok(parallel.every(([row]) => row.count === 208))
    console.info("Hosted SQL passed: restricted SELECT-only runtime, 208 exact kana, RLS, denied dormant-table access and concurrent reads. No data changed.")
  } finally { await pool.end() }
  await verifyHttp()
}
main().catch(() => { console.error("Hosted content verification failed. Check designated target/migrations/roles; no credentials or SQL details are logged."); process.exitCode = 1 })
