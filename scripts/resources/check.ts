import fs from "node:fs"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import { createRequire } from "node:module"
import type { Catalog, StudyCard } from "../../lib/platform/types"
const load = (s: string) => JSON.parse(fs.readFileSync(s, "utf8"))
const catalog = load("content/generated/catalog.json") as Catalog,
  cards = load("content/generated/cards.json") as StudyCard[]
const kana = load("content/kana.json") as { id: string; character: string; type: string }[]
const baseline = load("tests/fixtures/kana-baseline-v1.json")
assert.equal(cards.length, 2967)
assert.equal(catalog.sets.length, 19)
assert.equal(catalog.decks.length, 162)
assert.equal(cards.filter((c) => c.kind === "kanji").length, 2759)
assert.deepEqual(
  kana.map(({ id, character, type }) => ({ id, character, type })),
  baseline.entries,
)
const ids = new Set(cards.map((c) => c.id))
assert.equal(ids.size, cards.length)
assert.equal(new Set(catalog.decks.flatMap((d) => d.cardIds)).size, cards.length)
for (const d of catalog.decks) {
  assert.ok(d.cardIds.every((id) => ids.has(id)))
  assert.equal(new Set(d.cardIds).size, d.cardIds.length)
  assert.ok(catalog.sets.some((s) => s.slug === d.set && s.decks.includes(d.slug)))
  if (d.kind === "kanji") assert.ok(d.cardIds.length >= 10 && d.cardIds.length <= 60)
}
for (const c of cards) {
  assert.ok(c.meanings.length && c.readings.length)
  assert.ok(c.words.length <= 6)
  assert.ok(c.words.every((w) => w.written.includes(c.glyph) && w.reading && w.meanings.length))
}
const revision = crypto
  .createHash("sha256")
  .update(JSON.stringify({ cards, sets: catalog.sets, decks: catalog.decks }))
  .digest("hex")
assert.equal(catalog.revision, revision)
const oldCatalog = load("content/catalog-baseline-v1.json") as {
  cardIds: string[]
  decks: { slug: string; cardIds: string[] }[]
}
assert.equal(oldCatalog.cardIds.length, 2889)
assert.equal(oldCatalog.decks.length, 122)
assert.ok(oldCatalog.cardIds.every((id) => ids.has(id)))
for (const d of oldCatalog.decks)
  assert.deepEqual(catalog.decks.find((x) => x.slug === d.slug)?.cardIds, d.cardIds)
const api = createRequire(import.meta.url)("kanji-data") as { getJlpt: (n: number) => string[] }
for (const level of [5, 4, 3, 2, 1]) {
  const expected = [...api.getJlpt(level)].sort()
  const mapped = cards.filter((c) => c.kind === "kanji" && c.jlpt === level)
  assert.deepEqual(mapped.map((c) => c.glyph).sort(), expected)
  const members = catalog.decks.filter((d) => d.set === `jlpt-n${level}`).flatMap((d) => d.cardIds)
  assert.deepEqual([...members].sort(), mapped.map((c) => c.id).sort())
  assert.equal(new Set(members).size, members.length)
}
assert.equal(cards.filter((c) => c.kind === "kanji" && c.jlpt === null).length, 548)
for (const c of cards) assert.equal(catalog.cards.find((s) => s.id === c.id)?.jlpt, c.jlpt)
console.log(
  "Resource validation passed: 2,967 cards; 19 sets; 162 decks; complete coverage; frozen kana; source words; matching revision.",
)
