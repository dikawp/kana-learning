import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { once } from "node:events"
import { setTimeout as delay } from "node:timers/promises"

// External credentials are explicitly disabled. This suite never contacts Supabase.
const reservation = createServer()
reservation.listen(0, "127.0.0.1")
await once(reservation, "listening")
const address = reservation.address()
assert.ok(address && typeof address !== "string")
const port = address.port
await new Promise((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()))
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  env: { ...process.env, DATABASE_URL: "", MIGRATION_DATABASE_URL: "" },
})
child.stdout.resume(); child.stderr.resume()
const exited = once(child, "exit")
const base = "http://127.0.0.1:" + port
try {
  let ready = false
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw Error("Production test server exited before readiness")
    try { const response = await fetch(base + "/api/v1/health", { signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break } } catch { /* bounded startup retry */ }
    await delay(100)
  }
  assert.ok(ready, "Production API did not become ready")
  const page = await fetch(base)
  assert.equal(page.status, 200)
  const html = await page.text()
  assert.match(html, /Kana Learning/)
  assert.doesNotMatch(html, /href="\/account"/)
  assert.deepEqual(await (await fetch(base + "/api/v1/health")).json(), { contentConfigured: false, liveDependencyCheck: false })
  const missingContent = await fetch(base + "/api/v1/content/kana")
  assert.equal(missingContent.status, 503)
  assert.equal((await missingContent.json()).error.code, "DATABASE_UNAVAILABLE")
  assert.match(missingContent.headers.get("cache-control"), /no-store/)
  assert.equal(missingContent.headers.get("set-cookie"), null)
  for (const path of ["/account", "/account/password", "/auth/callback", "/api/v1/auth/session", "/api/v1/me/progress", "/api/v1/quiz-sessions"]) {
    assert.equal((await fetch(base + path)).status, 404, path)
  }
  const invalid = await fetch(base + "/api/v1/content/kana?unbounded=999")
  assert.equal(invalid.status, 422)
  console.info("Production HTTP passed: public shell, missing-content error, removed learner routes404, validation and no session cookies.")
} finally { if (child.exitCode === null) child.kill(); await exited }
