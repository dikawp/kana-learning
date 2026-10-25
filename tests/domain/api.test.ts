import { expect, test, vi } from "vitest"
vi.mock("server-only", () => ({}))
import { GET as catalogGET } from "../../app/api/catalog/route"
import { GET as cardGET } from "../../app/api/cards/[id]/route"
import { GET as deckGET } from "../../app/api/decks/[slug]/route"
test("public API returns versioned local data without credentials", async () => {
  const response = catalogGET(),
    data = await response.json()
  expect(data.cards).toHaveLength(2967)
  expect(data.decks).toHaveLength(162)
  expect(response.headers.get("etag")).toBe(`"${data.revision}"`)
  const request = new Request("http://localhost/api/cards/h-a")
  expect(
    (await (await cardGET(request, { params: Promise.resolve({ id: "h-a" }) })).json()).card.glyph,
  ).toBe("あ")
  expect((await cardGET(request, { params: Promise.resolve({ id: "missing" }) })).status).toBe(404)
  const deck = await (
    await deckGET(request, { params: Promise.resolve({ slug: "hiragana-basic" }) })
  ).json()
  expect(deck.cards).toHaveLength(46)
  expect(deck.deck.cardIds).toContain("h-a")
  expect((await deckGET(request, { params: Promise.resolve({ slug: "missing" }) })).status).toBe(
    404,
  )
})
