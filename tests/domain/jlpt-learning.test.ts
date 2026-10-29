import { describe, expect, test } from "vitest"
import {
  advanceSession,
  answerQuestion,
  beginSession,
  emptyProgress,
  markMaterial,
  progressSummary,
  selectQuestions,
  type JlptProgress,
} from "../../lib/jlpt/learning"
import { parseJlptProgress } from "../../lib/jlpt/save-schema"
import { exportBackup, parseBackup, stageBackup } from "../../lib/jlpt/backup"
import type { MaterialSummary, Question } from "../../lib/jlpt/types"
import { emptySlot, exportSlot } from "../../lib/platform/store"
import { upgradeResourceProgress } from "../../lib/jlpt/migration"
import aliases from "../../content/jlpt/generated/aliases.json"
import { startSession } from "../../lib/platform/learning"
import type { StudyCard } from "../../lib/platform/types"

const now = Date.UTC(2026, 9, 28)
const minute = 60_000
const material: MaterialSummary = {
  id: "n5-mizu",
  version: 1,
  level: "n5",
  skill: "moji-goi",
  kind: "vocabulary",
  title: "水",
  meaning: "air",
  objective: "Membaca kata air.",
  tags: ["daily-life"],
  sourceIds: ["original"],
  editorialStatus: "unreviewed",
  origin: "human-authored",
  levelBasis: "Starter vocabulary; not an official word list.",
}
const water: Question = {
  id: "water-reading",
  version: 1,
  level: "n5",
  skill: "moji-goi",
  type: "reading",
  materialId: material.id,
  conceptId: "water",
  variantGroup: "water-reading",
  prompt: "「水」をどう読みますか。",
  options: [
    { id: "mizu", label: "みず" },
    { id: "hi", label: "ひ" },
  ],
  answerId: "mizu",
  explanation: "水 dibaca みず.",
  distractors: { hi: "ひ adalah api." },
  sourceIds: ["original"],
}
const waterVariant: Question = {
  ...water,
  id: "water-context",
  type: "context",
  prompt: "のどがかわきました。（　）をのみます。",
  options: [
    { id: "mizu", label: "水" },
    { id: "hi", label: "火" },
  ],
}
const grammar: Question = {
  ...water,
  id: "polite-copula",
  skill: "bunpou",
  type: "grammar-form",
  materialId: "n5-desu",
  conceptId: "copula",
  variantGroup: "copula",
  prompt: "わたしは学生（　）。",
  options: [
    { id: "desu", label: "です" },
    { id: "masu", label: "ます" },
  ],
  answerId: "desu",
  explanation: "です mengikuti kata benda.",
  distractors: { masu: "ます mengikuti kata kerja." },
}
const begin = (questions = [water, grammar], progress = emptyProgress()) =>
  beginSession(progress, "n5", questions, "practice", now)
const answer = (progress: JlptProgress, correct = true, at = now) => {
  const s = progress.active!
  const q = s.questions[s.index]
  return answerQuestion(
    progress,
    s.id,
    s.index,
    correct ? q.answerId : q.options.find((o) => o.id !== q.answerId)!.id,
    1250,
    at,
  )
}
const complete = (progress = begin()) => {
  let result = progress
  while (result.active) result = advanceSession(answer(result), now + minute)
  return result
}

test("resource upgrades keep snapshots, preserve due dates and do not claim mastery of replacement content", () => {
  const alias = aliases.find((a) => a.id === "jlpt-n4-ta-koto-ga-aru")!
  const saved = begin(),
    date = new Date(now).toISOString()
  saved.materials[alias.id] = { status: "studied", updatedAt: date }
  saved.review[`${alias.id}-sense-1`] = {
    level: "n4",
    skill: "bunpou",
    materialId: alias.id,
    nextReviewAt: date,
    streak: 3,
    lastQuestionId: `${alias.id}-q1`,
  }
  const upgraded = upgradeResourceProgress(saved)
  expect(upgraded.materials[alias.targetId!]).toEqual({ status: "studying", updatedAt: date })
  expect(upgraded.review[`${alias.targetId}-sense-1`]).toMatchObject({
    level: "n5",
    nextReviewAt: date,
    streak: 0,
  })
  expect(upgraded.active).toBe(saved.active)
  expect(upgraded.history).toBe(saved.history)
  expect(saved.materials[alias.targetId!]).toBeUndefined()
  expect(upgradeResourceProgress(upgraded)).toBe(upgraded)
})

describe("JLPT learning notebook", () => {
  test("studying does not count as studied, and reopening preserves explicit completion", () => {
    const fresh = emptyProgress()
    expect(progressSummary(fresh, [material], now).studied).toBe(0)
    const studying = markMaterial(fresh, material, "studying", now)
    expect(progressSummary(studying, [material], now).studied).toBe(0)
    const studied = markMaterial(studying, material, "studied", now + minute)
    expect(progressSummary(studied, [material], now).studied).toBe(1)
    expect(
      markMaterial(studied, material, "studying", now + 2 * minute).materials[material.id].status,
    ).toBe("studied")
    expect(fresh.materials).toEqual({})
  })

  test("an answer is committed once and stale or unknown choices have no effect", () => {
    const original = begin(),
      session = original.active!
    expect(advanceSession(original)).toBe(original)
    expect(answerQuestion(original, "old-session", 0, "mizu", 10, now)).toBe(original)
    expect(answerQuestion(original, session.id, 1, "desu", 10, now)).toBe(original)
    expect(answerQuestion(original, session.id, 0, "forged-option", 10, now)).toBe(original)
    const recorded = answer(original)
    expect(answer(recorded, false, now + minute)).toBe(recorded)
    expect(recorded.active!.answers[0]).toMatchObject({
      choiceId: "mizu",
      correct: true,
      durationMs: 1250,
    })
    expect(recorded.review.water.streak).toBe(1)
    expect(original.active!.answers).toEqual([null, null])
  })

  test("a started and serialized session pins authored questions across content updates", () => {
    const catalog = structuredClone([water, grammar])
    const started = begin(catalog)
    catalog[0].prompt = "Changed after the learner started"
    catalog[0].answerId = "hi"
    catalog[0].options[0].label = "Updated option"
    const restored = parseJlptProgress(JSON.parse(JSON.stringify(started)))
    expect(restored.active!.questions[0]).toEqual(water)
    expect(answer(restored).active!.answers[0]?.correct).toBe(true)
  })

  test("review waits until due, selects another variant, and keeps one question per concept", () => {
    expect(selectQuestions(emptyProgress(), [water, waterVariant], "review", now)).toEqual([])
    const recorded = answer(begin([water]))
    expect(
      selectQuestions(recorded, [water, waterVariant, grammar], "review", now + 1440 * minute - 1),
    ).toEqual([])
    expect(
      selectQuestions(recorded, [water, waterVariant, grammar], "review", now + 1440 * minute),
    ).toEqual([waterVariant])
    expect(
      selectQuestions(emptyProgress(), [water, waterVariant, grammar], "practice", now),
    ).toEqual([water, grammar])
    expect(beginSession(emptyProgress(), "n1", [water], "practice", now).active).toBeNull()
  })

  test("correct review intervals grow to one, three, and seven days; mistakes reset them", () => {
    let progress = emptyProgress()
    let at = now
    for (const days of [1, 3, 7, 7]) {
      progress = beginSession(progress, "n5", [water, waterVariant], "practice", at)
      progress = answer(progress, true, at)
      expect(Date.parse(progress.review.water.nextReviewAt) - at).toBe(days * 24 * 60 * minute)
      progress = advanceSession(progress, at)
      at += days * 24 * 60 * minute
    }
    progress = answer(beginSession(progress, "n5", [water], "review", at), false, at)
    expect(progress.review.water.streak).toBe(0)
    expect(Date.parse(progress.review.water.nextReviewAt) - at).toBe(10 * minute)
    expect(selectQuestions(progress, [waterVariant], "review", at + 10 * minute)).toEqual([
      waterVariant,
    ])
  })

  test("completion preserves result snapshots and counts only completed answers", () => {
    const partial = answer(begin())
    expect(progressSummary(partial, [material], now).answered).toBe(0)
    const result = complete(partial)
    expect(result.active).toBeNull()
    expect(result.history).toHaveLength(1)
    expect(result.history[0].questions).toEqual([water, grammar])
    expect(result.history[0].finishedAt).toBe(new Date(now + minute).toISOString())
    expect(progressSummary(result, [material], now)).toMatchObject({
      correct: 1,
      answered: 1,
      accuracy: 100,
    })
    expect(advanceSession(result)).toBe(result)
    const second = complete(begin([waterVariant], result))
    expect(second.history).toHaveLength(2)
    expect(second.history[1]).toEqual(result.history[0])
    expect(parseJlptProgress(second)).toEqual(second)
  })
})

describe("JLPT saved-data validation", () => {
  test.each([
    "choice",
    "correctness",
    "future answer",
    "skipped answer",
    "wrong level",
    "duplicate question",
    "early finish",
    "unfinished history",
    "duplicate history",
    "active in history",
  ])("rejects %s corruption", (kind) => {
    const p = structuredClone(
      kind === "unfinished history" || kind === "duplicate history" || kind === "active in history"
        ? complete()
        : begin(),
    )
    if (kind === "choice" || kind === "correctness") {
      p.active!.answers[0] = {
        choiceId: kind === "choice" ? "invented" : "mizu",
        correct: false,
        answeredAt: new Date(now).toISOString(),
        durationMs: 0,
      }
    }
    if (kind === "future answer")
      p.active!.answers[1] = {
        choiceId: "desu",
        correct: true,
        answeredAt: new Date(now).toISOString(),
        durationMs: 0,
      }
    if (kind === "skipped answer") p.active!.index = 1
    if (kind === "wrong level") p.active!.questions[0].level = "n1"
    if (kind === "duplicate question")
      p.active!.questions[1] = structuredClone(p.active!.questions[0])
    if (kind === "early finish") p.active!.finishedAt = new Date(now).toISOString()
    if (kind === "unfinished history") p.history[0].finishedAt = null
    if (kind === "duplicate history") p.history.push(structuredClone(p.history[0]))
    if (kind === "active in history")
      p.active = { ...structuredClone(p.history[0]), finishedAt: null }
    expect(() => parseJlptProgress(p)).toThrow()
  })

  test.each([
    "https://evil.example/",
    "//evil.example/",
    "javascript:alert(1)",
    "/jlpt/n5/../../dashboard",
    "/jlpt/n5/%2e%2e/%2e%2e/dashboard",
    "/jlpt/n5/\nhttps://evil.example",
    "/jlpt/n1/practice",
  ])("rejects unsafe or mismatched resume href %s", (href) => {
    const p = emptyProgress()
    p.lastActivity = { href, title: "Resume", level: "n5", updatedAt: new Date(now).toISOString() }
    expect(() => parseJlptProgress(p)).toThrow()
  })
})

describe("versioned combined backups", () => {
  const legacyCard: StudyCard = {
    id: "hiragana-a",
    glyph: "あ",
    kind: "hiragana",
    meanings: ["a"],
    readings: ["a"],
    romaji: "a",
    on: [],
    kun: [],
    names: [],
    strokes: null,
    grade: null,
    jlpt: null,
    frequency: null,
    words: [],
  }
  const legacy = () => {
    const slot = emptySlot("Notebook")
    return {
      ...slot,
      active: startSession(slot, "hiragana-basic", "a".repeat(64), "quiz", [legacyCard], now),
    }
  }
  const allowedCards = new Set([legacyCard.id]),
    allowedDecks = new Set(["hiragana-basic"])

  test("imports a real v1 export with a fresh JLPT notebook", () => {
    const slot = legacy()
    expect(parseBackup(exportSlot(slot), allowedCards, allowedDecks)).toEqual({
      slot,
      jlpt: emptyProgress(),
    })
  })

  test("v2 export/import keeps lesson status, answered active session, review and result history", async () => {
    const slot = legacy()
    const jlpt = answer(begin([waterVariant], markMaterial(complete(), material, "studied", now)))
    await stageBackup({ slot, jlpt }, slot.id)
    const raw = await exportBackup(slot)
    expect(JSON.parse(raw).version).toBe(2)
    const imported = parseBackup(raw, allowedCards, allowedDecks)
    expect(imported).toEqual({ slot, jlpt: { ...jlpt, revision: 1 } })
    const clone = emptySlot("Clone")
    await stageBackup(imported, clone.id)
    expect(parseBackup(await exportBackup(clone), allowedCards, allowedDecks).jlpt).toEqual(
      imported.jlpt,
    )
  })

  test.each([1, 2])("v%i rejects unknown cards or decks before import", (version) => {
    const slot = legacy()
    const raw =
      version === 1
        ? exportSlot(slot)
        : JSON.stringify({ format: "kana-learn-sakura", version, slot, jlpt: emptyProgress() })
    expect(() => parseBackup(raw, new Set(), allowedDecks)).toThrow(/catalog/)
    expect(() => parseBackup(raw, allowedCards, new Set())).toThrow(/catalog/)
  })

  test("rejects malformed JLPT state, unsupported versions and excess envelope fields", () => {
    const base = { format: "kana-learn-sakura", version: 2, slot: legacy(), jlpt: emptyProgress() }
    expect(() =>
      parseBackup(
        JSON.stringify({ ...base, jlpt: { ...base.jlpt, revision: -1 } }),
        allowedCards,
        allowedDecks,
      ),
    ).toThrow()
    expect(() =>
      parseBackup(JSON.stringify({ ...base, version: 3 }), allowedCards, allowedDecks),
    ).toThrow()
    expect(() =>
      parseBackup(JSON.stringify({ ...base, secret: "unexpected" }), allowedCards, allowedDecks),
    ).toThrow()
  })
})
