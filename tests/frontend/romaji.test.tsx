import { expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReadingText } from "../../components/platform/reading-text"
import { CatalogSearch } from "../../components/platform/search"
import type { Catalog } from "../../lib/platform/types"

test("shows Japanese readings together with a separate Latin reading aid", () => {
  const readings = ["ニチ", "ジツ"]
  const { container } = render(<ReadingText readings={readings} />)
  expect(screen.getByText("ニチ / ジツ")).toHaveAttribute("lang", "ja")
  expect(screen.getByText("Romaji: nichi / jitsu")).toHaveAttribute("lang", "en")
  expect(container).not.toHaveTextContent("undefined")
  expect(readings).toEqual(["ニチ", "ジツ"])
})

test("missing readings do not produce invented Romaji", () => {
  render(<ReadingText readings={[]} />)
  expect(screen.getByText("Not supplied")).toBeInTheDocument()
  expect(screen.queryByText(/Romaji:/)).not.toBeInTheDocument()
})

test("finds a kanji by its derived Romaji reading", async () => {
  const catalog: Catalog = {
    revision: "a".repeat(64),
    decks: [],
    sets: [],
    cards: [
      { id: "kanji-65e5", kind: "kanji", glyph: "日", meanings: ["sun"], readings: ["ニチ", "ひ"] },
      {
        id: "kanji-6708",
        kind: "kanji",
        glyph: "月",
        meanings: ["moon"],
        readings: ["ゲツ", "つき"],
      },
    ],
  }
  const { container } = render(<CatalogSearch catalog={catalog} />)
  await userEvent.setup().type(screen.getByRole("searchbox"), "nichi")
  expect(container.querySelector('a[href="/card/kanji-65e5"]')).toBeInTheDocument()
  expect(container.querySelector('a[href="/card/kanji-6708"]')).not.toBeInTheDocument()
})

test("JLPT filtering distinguishes mapped cards, unassigned kanji and kana", async () => {
  const catalog: Catalog = {
    revision: "a".repeat(64),
    decks: [],
    sets: [],
    cards: [
      { id: "day", kind: "kanji", glyph: "日", meanings: ["sun"], readings: ["ニチ"], jlpt: 5 },
      { id: "calm", kind: "kanji", glyph: "凪", meanings: ["calm"], readings: ["なぎ"], jlpt: 1 },
      {
        id: "extra",
        kind: "kanji",
        glyph: "例",
        meanings: ["example"],
        readings: ["レイ"],
        jlpt: null,
      },
      { id: "kana", kind: "hiragana", glyph: "あ", meanings: ["a"], readings: ["a"], jlpt: null },
    ],
  }
  const { container } = render(<CatalogSearch catalog={catalog} />)
  const user = userEvent.setup()
  await user.selectOptions(screen.getByLabelText("JLPT level"), "1")
  expect(container.querySelectorAll(".character-tile")).toHaveLength(1)
  expect(container.querySelector('a[href="/card/calm"]')).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText("JLPT level"), "5")
  expect(container.querySelector('a[href="/card/day"]')).toBeInTheDocument()
  expect(container.querySelector('a[href="/card/calm"]')).not.toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText("JLPT level"), "unassigned")
  expect(container.querySelectorAll(".character-tile")).toHaveLength(1)
  expect(container.querySelector('a[href="/card/extra"]')).toBeInTheDocument()
})
