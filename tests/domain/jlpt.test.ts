import { expect, test, vi } from "vitest"
import { createRequire } from "node:module"
import cards from "../../content/generated/cards.json"
import catalog from "../../content/generated/catalog.json"
import baseline from "../../content/catalog-baseline-v1.json"
vi.mock("server-only", () => ({}))
import { GET } from "../../app/api/cards/[id]/route"
const api = createRequire(import.meta.url)("kanji-data") as { getJlpt: (n: number) => string[] }
test.each([5, 4, 3, 2, 1])(
  "N%s cards exactly match the pinned source and their practice decks",
  (level) => {
    const mapped = cards.filter((c) => c.kind === "kanji" && c.jlpt === level)
    expect(mapped.map((c) => c.glyph).sort()).toEqual([...api.getJlpt(level)].sort())
    const members = catalog.decks
      .filter((d) => d.set === `jlpt-n${level}`)
      .flatMap((d) => d.cardIds)
    expect(members.sort()).toEqual(mapped.map((c) => c.id).sort())
    expect(new Set(members).size).toBe(members.length)
  },
)
test("all previous cards and original deck memberships survive the expansion", () => {
  expect(baseline.cardIds).toHaveLength(2889)
  expect(baseline.decks).toHaveLength(122)
  expect(baseline.cardIds.every((id) => cards.some((c) => c.id === id))).toBe(true)
  for (const d of baseline.decks)
    expect(catalog.decks.find((x) => x.slug === d.slug)?.cardIds).toEqual(d.cardIds)
  expect(cards.filter((c) => c.kind === "kanji" && c.jlpt === null)).toHaveLength(548)
  expect(cards.filter((c) => c.kind !== "kanji").every((c) => c.jlpt === null)).toBe(true)
})
test("new N1 character details are exposed by the public API with matching summary", async () => {
  const response = await GET(new Request("http://localhost/api/cards/kanji-51ea"), {
    params: Promise.resolve({ id: "kanji-51ea" }),
  })
  const { card } = await response.json()
  expect(card.glyph).toBe("凪")
  expect(card.jlpt).toBe(1)
  expect(card.readings.length).toBeGreaterThan(0)
  expect(catalog.cards.find((c) => c.id === card.id)?.jlpt).toBe(1)
})
