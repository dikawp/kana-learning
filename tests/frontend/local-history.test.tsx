import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { createStudyStore, parseStudy, STUDY_KEY } from "@/lib/study/local-store"
import { MAX_HISTORY, MAX_STUDY_CHARS } from "@/lib/study/contracts"
import { calculateQuizResults } from "@/lib/kana/quiz"
import { kanaData } from "@/lib/kana-data"
import { QuizMode } from "@/components/kana/quiz-mode"
import KanaLearningApp from "@/app/page"

const content = kanaData.slice(0, 2)
function fixture(raw: string | null = null, failWrite = false) {
  let value = raw
  const storage = { getItem: vi.fn(() => value), setItem: vi.fn((_key: string, next: string) => { if (failWrite) throw Error("quota"); value = next }) }
  const store = createStudyStore(content, () => storage)
  store.subscribe(() => {})
  return { store, storage, raw: () => value }
}
function finish(store: ReturnType<typeof createStudyStore>, wrong = false) {
  const session = store.getSnapshot().data.active!
  for (let position = 0; position < session.questions.length; position++) {
    const q = session.questions[position]
    store.answer(session.id, position, wrong ? q.options.find((v) => v !== q.correctAnswer)! : q.correctAnswer)
    store.advance(session.id, position)
  }
}

describe("bounded device-local quiz contracts", () => {
  it("reads without writing and resumes unanswered or answered feedback after new store creation", () => {
    const f = fixture()
    expect(f.storage.setItem).not.toHaveBeenCalled()
    f.store.start({ type: "all", questionCount: 5 }, "revision-1")
    const s = f.store.getSnapshot().data.active!
    expect(fixture(f.raw()).store.getSnapshot().data.active).toEqual(s)
    f.store.answer(s.id, 0, s.questions[0].correctAnswer)
    const resumed = fixture(f.raw()).store
    expect(resumed.getSnapshot().data.active?.answers).toHaveLength(1)
    expect(resumed.answer(s.id, 0, s.questions[0].correctAnswer)).toBe(false)
    resumed.advance(s.id, 0)
    expect(resumed.getSnapshot().data.active?.position).toBe(1)
  })
  it("accepts one answer/advance/completion and rejects stale/foreign/invalid submissions", () => {
    const { store } = fixture()
    store.start({ type: "all", questionCount: 5 }, "v1")
    const s = store.getSnapshot().data.active!
    expect(store.start({ type: "all", questionCount: 5 }, "v1")).toBe(false)
    expect(store.answer("other", 0, "a")).toBe(false)
    expect(store.answer(s.id, 0, "unknown")).toBe(false)
    expect(store.advance(s.id, 0)).toBeNull()
    finish(store)
    expect(store.advance(s.id, 1)).toBeNull()
    expect(store.getSnapshot().data.history).toHaveLength(1)
    expect(calculateQuizResults(store.getSnapshot().data.history[0].questions, store.getSnapshot().data.history[0].answers).score).toBe(2)
  })
  it("retains historical answers across new content readings and never trusts a stored score", () => {
    const f = fixture()
    f.store.start({ type: "all", questionCount: 5 }, "old-revision"); finish(f.store)
    const revised = content.map((q) => ({ ...q, romaji: "changed" }))
    const saved = parseStudy(f.raw(), revised).history[0]
    expect(calculateQuizResults(saved.questions, saved.answers).score).toBe(2)
    const bad = JSON.parse(f.raw()!)
    bad.history[0].score = 999
    expect(() => parseStudy(JSON.stringify(bad), revised)).toThrow()
  })
  it.each(["{", "null", '{"version":9}', "x".repeat(MAX_STUDY_CHARS + 1)])("discloses invalid saved state without initial overwrite (%#)", (raw) => {
    const f = fixture(raw)
    expect(f.store.getSnapshot().status).toBe("memory")
    expect(f.storage.setItem).not.toHaveBeenCalled()
    f.store.start({ type: "all", questionCount: 5 }, "v1")
    expect(f.store.getSnapshot().data.active).not.toBeNull()
  })
  it("rejects unknown IDs, duplicate prompts, wrong cursors and forged option/answer snapshots", () => {
    const f = fixture(); f.store.start({ type: "all", questionCount: 5 }, "v1")
    for (const change of [
      (s: Record<string, unknown>) => { s.position = 24 },
      (s: Record<string, unknown>) => { s.answers = ["not-an-option"] },
    ]) {
      const data = JSON.parse(f.raw()!); change(data.active)
      expect(() => parseStudy(JSON.stringify(data), content)).toThrow()
    }
    const data = JSON.parse(f.raw()!)
    data.active.questions[0].character.id = "unknown"
    expect(() => parseStudy(JSON.stringify(data), content)).toThrow()
    data.active.questions[0] = data.active.questions[1]
    expect(() => parseStudy(JSON.stringify(data), content)).toThrow()
  })
  it("keeps working in memory on denied/quota storage and preserves the stored original", () => {
    const f = fixture(null, true)
    f.store.start({ type: "all", questionCount: 5 }, "v1"); finish(f.store)
    expect(f.store.getSnapshot().status).toBe("memory")
    expect(f.store.getSnapshot().data.history).toHaveLength(1)
    expect(f.raw()).toBeNull()
    const denied = createStudyStore(content, () => { throw Error("denied") })
    denied.subscribe(() => {})
    expect(denied.getSnapshot().status).toBe("memory")
    expect(() => denied.start({ type: "all", questionCount: 5 }, "v1")).not.toThrow()
  })
  it("bounds history, cancels without creating a result and clears history without resetting active state", () => {
    const { store } = fixture()
    for (let i = 0; i < MAX_HISTORY + 2; i++) { store.start({ type: "all", questionCount: 5 }, "v1"); finish(store) }
    expect(store.getSnapshot().data.history).toHaveLength(MAX_HISTORY)
    store.start({ type: "all", questionCount: 5 }, "v1")
    const id = store.getSnapshot().data.active!.id
    store.clearHistory()
    expect(store.getSnapshot().data.active?.id).toBe(id)
    store.cancel()
    expect(store.getSnapshot().data).toEqual({ version: 1, active: null, history: [] })
  })
})

it("resumes actual quiz UI after unmount and reviews persisted mistakes", () => {
  const props = { kanaData: content, onMarkAsLearned: vi.fn(), isLearned: () => false, onSwitchToFlashcard: vi.fn() }
  let view = render(<QuizMode {...props} />)
  fireEvent.click(screen.getByRole("button", { name: "Start Quiz" }))
  const saved = parseStudy(localStorage.getItem(STUDY_KEY), content)
  const q = saved.active!.questions[0]
  fireEvent.click(screen.getByRole("button", { name: q.options.find((v) => v !== q.correctAnswer)! }))
  view.unmount()
  view = render(<QuizMode {...props} />)
  expect(screen.getByText("Incorrect!")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "Next Question" }))
  const next = parseStudy(localStorage.getItem(STUDY_KEY), content).active!.questions[1]
  fireEvent.click(screen.getByRole("button", { name: next.correctAnswer }))
  fireEvent.click(screen.getByRole("button", { name: "See Results" }))
  view.unmount()
  render(<QuizMode {...props} />)
  fireEvent.click(screen.getByRole("button", { name: "Review result" }))
  expect(screen.getByText("50%")).toBeInTheDocument()
  expect(screen.getByText(/Your:/)).toBeInTheDocument()
})

it("shows the persisted script after resuming and keeps a bounded last score on the actual page", async () => {
  const store = createStudyStore(kanaData)
  store.start({ type: "hiragana", questionCount: 5 }, "original-revision")
  const props = { kanaData, onMarkAsLearned: vi.fn(), isLearned: () => false, onSwitchToFlashcard: vi.fn() }
  const view = render(<QuizMode {...props} />)
  expect(screen.getByText("Hiragana")).toBeInTheDocument()
  expect(screen.getByText(/original question and answer revision/)).toBeInTheDocument()
  view.unmount()
  finish(store)
  render(<KanaLearningApp />)
  expect(await screen.findByText("Last Quiz (this device): 5/5 (100%)")).toBeInTheDocument()
})

it("loads one public content source, retries errors, preserves storage and has all three modes without Account", async () => {
  localStorage.setItem("untouched", "keep")
  vi.mocked(fetch).mockRejectedValueOnce(Error("Material unavailable"))
  render(<KanaLearningApp />)
  expect(await screen.findByRole("alert")).toHaveTextContent("Material unavailable")
  expect(screen.queryByRole("tab")).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "Retry material" }))
  await screen.findByRole("tab", { name: "Table View" })
  expect(screen.getAllByRole("tab")).toHaveLength(3)
  expect(screen.queryByRole("link", { name: "Account" })).not.toBeInTheDocument()
  expect(fetch).toHaveBeenLastCalledWith("/api/v1/content/kana", expect.objectContaining({ credentials: "omit" }))
  expect(localStorage.getItem("untouched")).toBe("keep")
})

it("replaces quiz snapshots across tabs, including clearing, without resurrecting old results", async () => {
  const { store } = fixture()
  store.start({ type: "all", questionCount: 5 }, "v1")
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: STUDY_KEY, storageArea: localStorage, newValue: null })))
  await waitFor(() => expect(store.getSnapshot().data.active).toBeNull())
  expect(store.getSnapshot().data.history).toEqual([])
})
