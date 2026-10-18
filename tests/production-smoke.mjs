import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { once } from "node:events"
import { setTimeout as delay } from "node:timers/promises"

// Automated loopback-only production integration; never inherits external service credentials.
const reservation = createServer()
reservation.listen(0, "127.0.0.1")
await once(reservation, "listening")
const address = reservation.address()
assert.ok(address && typeof address !== "string")
const port = address.port
await new Promise((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()))
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  env: { ...process.env, SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "", DATABASE_URL: "", MIGRATION_DATABASE_URL: "", APP_ORIGIN: `http://127.0.0.1:${port}` },
})
// Drain pipes without printing potentially environment-specific process output.
child.stdout.resume(); child.stderr.resume()
const exited = once(child, "exit")
const base = `http://127.0.0.1:${port}`
try {
  let ready = false
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw Error("Production test server exited before readiness")
    try { const response = await fetch(`${base}/api/v1/health`, { signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break } } catch { /* bounded startup retry */ }
    await delay(100)
  }
  assert.ok(ready, "Production API did not become ready")
  const guest = await fetch(base)
  assert.equal(guest.status, 200)
  assert.match(await guest.text(), /Kana Learning/)
  assert.equal((await fetch(`${base}/account`)).status, 200)
  const session = await fetch(`${base}/api/v1/auth/session`)
  assert.deepEqual(await session.json(), { configured: false, user: null })
  assert.match(session.headers.get("cache-control"), /private.*no-store/)
  const protectedProgress = await fetch(`${base}/api/v1/me/progress`)
  assert.equal(protectedProgress.status, 503)
  const error = await protectedProgress.json()
  assert.equal(error.error.code, "AUTH_UNAVAILABLE")
  assert.equal(typeof error.error.requestId, "string")
  const missing = await fetch(`${base}/api/v1/nonexistent`)
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error.code, "NOT_FOUND")
  console.info("Production integration passed: guest/account routes, Elysia API, private session/error responses; external services disabled.")
} finally {
  if (child.exitCode === null) child.kill()
  await exited
}
