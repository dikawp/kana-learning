import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { once } from "node:events"
import { setTimeout as delay } from "node:timers/promises"

const reservation = createServer()
reservation.listen(0, "127.0.0.1")
await once(reservation, "listening")
const port = reservation.address().port
await new Promise((resolve) => reservation.close(resolve))
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
  { env: { ...process.env, NODE_ENV: "production" }, stdio: ["ignore", "pipe", "pipe"] },
)
let output = ""
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    output += chunk.toString()
  })
try {
  const origin = `http://127.0.0.1:${port}`
  let ready = false
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true
        break
      }
    } catch {
      /* Wait for the owned production server. */
    }
    await delay(200)
  }
  assert.ok(ready, output)
  for (const route of [
    "/",
    "/archive",
    "/jlpt",
    "/jlpt/n5",
    "/jlpt/n1/bunpou",
    "/jlpt/n5/dokkai",
    "/jlpt/n5/choukai",
    "/jlpt/n5/practice",
    "/jlpt/n5/review",
    "/jlpt/n5/mock",
    "/jlpt/n5/units",
    "/jlpt/n5/moji-goi/jlpt-n5-v-ada066edfd",
    "/set/jlpt-n1",
    "/card/kanji-51ea",
    "/set/hiragana",
    "/deck/hiragana-basic",
    "/deck/hiragana-basic/practice?mode=quiz",
    "/card/h-a",
    "/card/kanji-65e5",
    "/search",
    "/dashboard",
    "/sources",
    "/privacy",
  ]) {
    const r = await fetch(origin + route)
    assert.equal(r.status, 200, route)
    assert.match(await r.text(), /Kana-Learn/)
  }
  const c = await fetch(origin + "/api/catalog")
  assert.equal(c.status, 200)
  const catalog = await c.json()
  assert.equal(catalog.cards.length, 2967)
  assert.equal(catalog.decks.length, 162)
  assert.equal(catalog.sets.length, 19)
  const d = await (await fetch(origin + "/api/decks/hiragana-basic")).json()
  assert.equal(d.cards.length, 46)
  const k = await (await fetch(origin + "/api/cards/kanji-65e5")).json()
  assert.equal(k.card.glyph, "日")
  const questions = await fetch(origin + "/api/jlpt/questions?level=n5&ids=jlpt-n5-v-ada066edfd")
  assert.equal(questions.status, 200)
  assert.equal((await questions.json()).questions.length, 2)
  for (const route of [
    "/card/not-real",
    "/deck/not-real",
    "/api/cards/not-real",
    "/api/decks/not-real",
    "/api/v1/content/kana",
    "/account",
  ]) {
    assert.equal((await fetch(origin + route)).status, 404, route)
  }
  console.log(
    "Production HTTP smoke passed: pages, versioned local APIs, unknown IDs and retired endpoints.",
  )
} finally {
  server.kill()
  await Promise.race([once(server, "exit"), delay(5000)])
}
