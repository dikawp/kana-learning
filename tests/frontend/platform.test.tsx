import { expect, test, vi } from "vitest"
import { render, screen, fireEvent, act, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import { Practice } from "../../components/platform/practice"
import { Dashboard } from "../../components/platform/dashboard"
import { SAVE_KEY } from "../../lib/platform/store"
import type { Catalog, StudyCard, Deck } from "../../lib/platform/types"
const cards: StudyCard[] = ["a", "i", "u", "e"].map((r, i) => ({
  id: `h-${r}`,
  glyph: ["あ", "い", "う", "え"][i],
  kind: "hiragana",
  meanings: [r],
  readings: [r],
  romaji: r,
  group: "basic",
  on: [],
  kun: [],
  names: [],
  strokes: null,
  grade: null,
  jlpt: null,
  frequency: null,
  words: [],
}))
const deck: Deck = {
  slug: "hiragana-basic",
  title: "Hiragana Basic",
  set: "hiragana",
  description: "Practice",
  kind: "hiragana",
  cardIds: cards.map((c) => c.id),
  method: "kana",
}
const catalog: Catalog = { revision: "a".repeat(64), cards, decks: [deck], sets: [] }
test("practice, resume, accessible feedback, slots and memory-only persistence", async () => {
  const user = userEvent.setup()
  localStorage.setItem("kana-learning:guest:v1", "legacy-kept")
  let view = render(
    <Practice deck={deck} cards={cards} revision={catalog.revision} initialMode="flashcards" />,
  )
  await user.click(await screen.findByRole("button", { name: /Start flashcards/i }))
  await user.click(screen.getByRole("button", { name: "Show answer" }))
  await user.click(screen.getByRole("button", { name: /Got It Let it settle/ }))
  expect(screen.getByText(/Got it. A small step/)).toBeInTheDocument()
  const raw = localStorage.getItem(SAVE_KEY)!
  expect(JSON.parse(raw).slots[0].cards).toBeTruthy()
  view.unmount()
  view = render(
    <Practice deck={deck} cards={cards} revision={catalog.revision} initialMode="flashcards" />,
  )
  expect(await screen.findByRole("button", { name: "Next character" })).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Show answer" })).not.toBeInTheDocument()
  const audit = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })
  expect(
    audit.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toHaveLength(0)
  await user.click(screen.getByRole("button", { name: "Next character" }))
  view.unmount()
  render(<Dashboard catalog={catalog} />)
  expect(await screen.findByText(/1 EXP earned/)).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "New slot" }))
  expect(await screen.findByText("Keep growing, Player 2.")).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText("Active save"), JSON.parse(raw).activeSlotId)
  expect(screen.getByText(/1 EXP earned/)).toBeInTheDocument()
  const rename = screen.getByLabelText("Rename active slot")
  await user.type(rename, "Sakura")
  await user.click(screen.getByRole("button", { name: "Rename" }))
  expect(screen.getByText("Keep growing, Sakura.")).toBeInTheDocument()
  vi.spyOn(window, "confirm").mockReturnValue(false)
  await user.click(screen.getByRole("button", { name: "Reset progress" }))
  expect(screen.getByText(/1 EXP earned/)).toBeInTheDocument()
  expect(localStorage.getItem("kana-learning:guest:v1")).toBe("legacy-kept")
  const native = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k, v) {
    if (k === SAVE_KEY) throw new DOMException("full", "QuotaExceededError")
    return native.call(this, k, v)
  })
  await user.click(screen.getByRole("button", { name: "Duplicate" }))
  expect(await screen.findByText(/Progress could not be saved/)).toBeInTheDocument()
  expect(within(screen.getByLabelText("Active save")).getAllByRole("option")).toHaveLength(3)
  act(() => {
    fireEvent(
      window,
      new StorageEvent("storage", {
        key: SAVE_KEY,
        newValue: "invalid",
        storageArea: localStorage,
      }),
    )
  })
  expect(screen.getByText(/Keep growing, Sakura Copy/)).toBeInTheDocument()
}, 20000)
