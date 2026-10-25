import { describe, expect, test } from "vitest"
import {
  advance,
  levelFor,
  makeQuestion,
  rate,
  startSession,
  stats,
  type Slot,
} from "../../lib/platform/learning"
import { emptySlot, exportSlot, parseImport, parseSave } from "../../lib/platform/store"
import type { StudyCard } from "../../lib/platform/types"

const revision = "a".repeat(64),
  now = Date.UTC(2026, 9, 25)
const card = (id: string, glyph: string, reading: string): StudyCard => ({
  id,
  glyph,
  kind: "hiragana",
  meanings: [reading],
  readings: [reading],
  romaji: reading,
  on: [],
  kun: [],
  names: [],
  strokes: null,
  grade: null,
  jlpt: null,
  frequency: null,
  words: [],
})
const cards = [
  card("h-a", "あ", "a"),
  card("h-i", "い", "i"),
  card("h-u", "う", "u"),
  card("h-e", "え", "e"),
]
const begin = (mode: "quiz" | "review" | "flashcards" = "quiz", base = emptySlot()): Slot => ({
  ...base,
  active: startSession(base, "hiragana-basic", revision, mode, cards, now, () => 0.5),
})

describe("learning transitions", () => {
  test.each([
    ["again", 10],
    ["learning", 1440],
    ["known", 4320],
  ] as const)("%s schedules exactly %i minutes and records once", (rating, minutes) => {
    const before = begin(),
      s = before.active!,
      next = rate(before, s.id, 0, rating, now),
      progress = next.cards[s.cards[0].id]
    expect(Date.parse(progress.nextReviewAt) - now).toBe(minutes * 60000)
    expect(progress.encounters).toBe(1)
    expect(progress.correct).toBe(Number(rating !== "again"))
    expect(rate(next, s.id, 0, rating, now)).toBe(next)
    expect(rate(before, "stale-session", 0, rating, now)).toBe(before)
    expect(rate(before, s.id, 1, rating, now)).toBe(before)
  })
  test("cannot skip unanswered questions and completes once", () => {
    let slot = begin()
    expect(advance(slot, now)).toBe(slot)
    while (slot.active) {
      slot = rate(slot, slot.active.id, slot.active.index, "known", now)
      slot = advance(slot, now)
    }
    expect(slot.history).toHaveLength(1)
    expect(slot.history[0].answers.every((a) => a === "known")).toBe(true)
    expect(advance(slot, now)).toBe(slot)
    expect(stats(slot, undefined, now).correct).toBe(4)
  })
  test("retains answered state and pinned questions through serialized refresh", () => {
    const slot = begin(),
      s = slot.active!,
      answered = rate(slot, s.id, 0, "again", now, s.questions[0].options[0].id)
    const save = parseSave(JSON.stringify({ version: 1, activeSlotId: slot.id, slots: [answered] }))
    expect(save.slots[0].active).toEqual(answered.active)
    expect(rate(save.slots[0], s.id, 0, "known", now)).toBe(save.slots[0])
  })
  test("review is empty for new cards and includes learning before due", () => {
    expect(begin("review").active!.cards).toHaveLength(0)
    const s = begin()
    const rated = rate(s, s.active!.id, 0, "learning", now)
    const review = startSession(rated, "hiragana-basic", revision, "review", cards, now)
    expect(review.cards).toHaveLength(1)
    expect(stats(rated, undefined, now).due).toBe(0)
    expect(stats(rated, undefined, now + 1440 * 60000).due).toBe(1)
  })
  test("quiz has no repeated cards, caps at20, and all options are unique", () => {
    const pool = Array.from({ length: 30 }, (_, i) => card(`h-${i}`, String(i), `r${i}`))
    const s = startSession(emptySlot(), "pool", revision, "quiz", pool, now)
    expect(s.cards).toHaveLength(20)
    expect(new Set(s.cards.map((c) => c.id)).size).toBe(20)
    for (const q of s.questions) {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options.map((o) => o.label)).size).toBe(4)
      expect(q.options.some((o) => o.id === q.answerId)).toBe(true)
    }
  })
  test("shared readings and meanings are not wrong distractors", () => {
    const a = {
      ...cards[0],
      id: "k1",
      kind: "kanji" as const,
      romaji: undefined,
      meanings: ["sun"],
      readings: ["ニチ"],
    }
    const same = { ...a, id: "k2", glyph: "X" },
      different = { ...a, id: "k3", glyph: "Y", meanings: ["moon"], readings: ["ゲツ"] }
    for (const i of [0, 1, 2])
      expect(makeQuestion(a, [a, same, different], i).options.some((o) => o.id === "k2")).toBe(
        false,
      )
  })
  test("mastery is100 correct and level thresholds are deterministic", () => {
    const s = begin(),
      next = rate(s, s.active!.id, 0, "known", now),
      id = s.active!.cards[0].id
    expect(stats(next, undefined, now).mastered).toBe(0)
    next.cards[id] = { ...next.cards[id], correct: 100, encounters: 100 }
    expect(stats(next, undefined, now).mastered).toBe(1)
    expect(levelFor(0)).toEqual({ level: 1, current: 0, required: 23 })
    expect(levelFor(23).level).toBe(2)
  })
})
describe("save contracts", () => {
  test("export/import round-trip keeps answers and EXP without adding events", () => {
    const s = begin(),
      rated = rate(s, s.active!.id, 0, "known", now)
    const imported = parseImport(exportSlot(rated), new Set(cards.map((c) => c.id)))
    expect(imported).toEqual(rated)
    expect(stats(imported).correct).toBe(1)
  })
  test("rejects unknown versions, unknown cards, invalid counters, and oversized input", () => {
    const s = begin(),
      rated = rate(s, s.active!.id, 0, "known", now)
    expect(() => parseImport(exportSlot(rated), new Set())).toThrow()
    expect(() =>
      parseImport(exportSlot(rated), new Set(cards.map((c) => c.id)), new Set(["other-deck"])),
    ).toThrow(/deck catalog/)
    expect(() =>
      parseImport(
        exportSlot(rated).replace('"version": 1', '"version": 2'),
        new Set(cards.map((c) => c.id)),
      ),
    ).toThrow()
    expect(() => parseSave("x".repeat(4 * 1024 * 1024 + 1))).toThrow()
    rated.cards[rated.active!.cards[0].id].encounters = 900
    expect(() => parseImport(exportSlot(rated), new Set(cards.map((c) => c.id)))).toThrow()
  })
  test("history is capped at20 completed sessions", () => {
    let slot = emptySlot()
    for (let i = 0; i < 22; i++) {
      slot = {
        ...slot,
        active: startSession(slot, "one", revision, "quiz", cards.slice(0, 1), now + i),
      }
      slot = rate(slot, slot.active!.id, 0, "known", now + i)
      slot = advance(slot, now + i)
    }
    expect(slot.history).toHaveLength(20)
    expect(stats(slot).correct).toBe(22)
  })
})
