import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import axe from "axe-core"
import { FlashcardMode } from "@/components/kana/flashcard-mode"
import { QuizMode } from "@/components/kana/quiz-mode"
import { TableView } from "@/components/kana/table-view"
import { kanaData } from "@/lib/kana-data"
import { createStudyStore } from "@/lib/study/local-store"
import KanaLearningApp from "@/app/page"

describe("flashcard pool lifecycle", () => {
  it("wraps, resets index/reveal on shrink, tolerates empty pools, and marks the displayed ID", async () => {
    const user = userEvent.setup()
    const mark = vi.fn()
    const props = { onMarkAsLearned: mark, isLearned: () => false }
    const view = render(<FlashcardMode filteredKana={kanaData} {...props} />)
    await user.click(screen.getByRole("button", { name: "Previous" }))
    expect(screen.getByText("208 / 208")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Show Answer" }))
    expect(screen.getByText("pyo")).toBeInTheDocument()
    view.rerender(<FlashcardMode filteredKana={[kanaData[0]]} {...props} />)
    expect(screen.getByText("1 / 1")).toBeInTheDocument()
    expect(screen.queryByText("pyo")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Got it!" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Show Answer" }))
    await user.click(screen.getByRole("button", { name: "Got it!" }))
    expect(mark).toHaveBeenCalledExactlyOnceWith("h-a")
    view.rerender(<FlashcardMode filteredKana={[]} {...props} />)
    expect(screen.getByText("No characters match your current filters.")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    view.rerender(<FlashcardMode filteredKana={kanaData} {...props} />)
    expect(screen.getByText("1 / 208")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText("2 / 208")).toBeInTheDocument()
  })
})

describe("quiz lifecycle", () => {
  function mount(data = kanaData.slice(0, 2)) {
    const mark = vi.fn()
    const store = createStudyStore(data)
    const switchMode = vi.fn()
    vi.spyOn(Math, "random").mockReturnValue(0)
    return { ...render(<QuizMode kanaData={data} onMarkAsLearned={mark} store={store} isLearned={() => false} onSwitchToFlashcard={switchMode} />), mark, store, switchMode }
  }

  it("accepts one answer, provides untimed feedback, scores once and reviews correct/incorrect items", async () => {
    const user = userEvent.setup()
    const { mark, store, switchMode } = mount()
    await user.click(screen.getByRole("button", { name: "Start Quiz" }))
    expect(screen.getByText("い")).toHaveAttribute("lang", "ja")
    const wrong = screen.getByRole("button", { name: "a" })
    const right = screen.getByRole("button", { name: "i" })
    act(() => { wrong.click(); right.click() })
    expect(mark).not.toHaveBeenCalled()
    expect(screen.getByText("Incorrect!")).toBeInTheDocument()
    expect(right).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Next Question" }))
    expect(screen.getByText("あ")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "a" }))
    expect(mark).toHaveBeenCalledExactlyOnceWith("h-a")
    const finish = screen.getByRole("button", { name: "See Results" })
    act(() => { finish.click(); finish.click() })
    expect(store.getSnapshot().data.history).toHaveLength(1)
    expect(store.getSnapshot().data.history[0].answers).toEqual(["a", "a"])
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("Your: a")).toBeInTheDocument()
    expect(screen.getByText("Correct: i")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Practice More" }))
    expect(switchMode).toHaveBeenCalledOnce()
    await user.click(screen.getByRole("button", { name: "New Quiz" }))
    expect(screen.getByText("Quiz Setup")).toBeInTheDocument()
    expect(screen.queryByText("50%")).not.toBeInTheDocument()
  })

  it("supports cancel/restart and unmount without delayed callbacks or stale results", () => {
    vi.useFakeTimers()
    try {
      const view = mount()
      fireEvent.click(screen.getByRole("button", { name: "Start Quiz" }))
      fireEvent.click(screen.getByRole("button", { name: "i" }))
      fireEvent.click(screen.getByRole("button", { name: "Cancel Quiz" }))
      act(() => vi.runAllTimers())
      expect(screen.getByText("Quiz Setup")).toBeInTheDocument()
      expect(view.store.getSnapshot().data.history).toHaveLength(0)
      fireEvent.click(screen.getByRole("button", { name: "Start Quiz" }))
      expect(screen.getByRole("button", { name: "i" })).toBeEnabled()
      fireEvent.click(screen.getByRole("button", { name: "i" }))
      view.unmount()
      act(() => vi.runAllTimers())
      expect(view.store.getSnapshot().data.history).toHaveLength(0)
    } finally { vi.useRealTimers() }
  })

  it("reports an empty quiz pool without entering a blank playing state", async () => {
    const user = userEvent.setup()
    mount([])
    await user.click(screen.getByRole("button", { name: "Start Quiz" }))
    expect(screen.getByRole("alert")).toHaveTextContent("No kana are available")
    expect(screen.getByText("Quiz Setup")).toBeInTheDocument()
    expect(screen.queryByText("What is the romaji for this character?")).not.toBeInTheDocument()
  })
})

describe("application semantics and regression integration", () => {
  it("supports search, empty results, table mode, quiz scope and reset cancellation through the actual page", async () => {
    const user = userEvent.setup()
    render(<KanaLearningApp />)
    await screen.findByRole("textbox", { name: "Search kana or Romaji" })
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Toggle color theme" })).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Overall familiarity" })).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Overall familiarity" })).toHaveAttribute("aria-valuenow", "0")
    screen.getByRole("combobox", { name: "Kana script" }).focus()
    await user.keyboard("{ArrowDown}")
    await user.click(screen.getByRole("option", { name: "Hiragana" }))
    expect(screen.getByText("104 characters")).toBeInTheDocument()
    screen.getByRole("combobox", { name: "Kana group" }).focus()
    await user.keyboard("{ArrowDown}")
    await user.click(screen.getByRole("option", { name: "Handakuten (p sounds)" }))
    expect(screen.getByText("5 characters")).toBeInTheDocument()
    // Restore the all/all pool before testing literal search through both scripts.
    for (const [label, option] of [["Kana script", "All Types"], ["Kana group", "All Categories"]]) {
      screen.getByRole("combobox", { name: label }).focus()
      await user.keyboard("{ArrowDown}")
      await user.click(screen.getByRole("option", { name: option }))
    }
    const search = screen.getByRole("textbox", { name: "Search kana or Romaji" })
    await user.type(search, " SHI ")
    expect(screen.getByText("2 characters")).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Table View" }))
    expect(screen.getByText("し")).toBeInTheDocument()
    expect(screen.getByText("シ")).toBeInTheDocument()
    expect(screen.getAllByRole("columnheader", { name: "Romaji" })).toHaveLength(2)
    await user.clear(search)
    await user.type(search, "not-a-kana")
    expect(screen.getByText("No characters match your current filters.")).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Quiz Mode" }))
    expect(screen.getByText(/independently of browse filters/)).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Quiz Type" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Number of Questions" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reset All" }))
    const dialog = screen.getByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("passes automated control/ARIA/table semantic rules on the page and all 208 table entries", async () => {
    const page = render(<KanaLearningApp />)
    await screen.findByRole("textbox", { name: "Search kana or Romaji" })
    // jsdom has no layout engine. These rules check semantics; no visual/contrast claim is made.
    const rules = ["button-name", "label", "select-name", "aria-valid-attr-value", "aria-required-attr", "aria-progressbar-name", "td-headers-attr", "th-has-data-cells"]
    expect((await axe.run(page.container, { runOnly: { type: "rule", values: rules } })).violations).toEqual([])
    page.unmount()
    const table = render(<TableView filteredKana={kanaData} />)
    expect(table.container.querySelectorAll("tbody tr")).toHaveLength(208)
    expect((await axe.run(table.container, { runOnly: { type: "rule", values: rules } })).violations).toEqual([])
  })
})
