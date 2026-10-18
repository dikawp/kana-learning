import { describe, expect, it } from "vitest"
import { kanaData } from "@/lib/kana-data"
import { filterKana, getCategoryGroup } from "@/lib/kana/search"
import { calculateQuizResults, generateQuizQuestions } from "@/lib/kana/quiz"

describe("kana filtering", () => {
  it("searches actual kana/Romaji fields with whitespace, width and case normalization", () => {
    const expected = ["h-shi", "k-shi"]
    for (const query of ["shi", "SHI", "  shi  ", "ＳＨＩ"]) {
      expect(filterKana(kanaData, "all", "all", query).map((kana) => kana.id)).toEqual(expected)
    }
    expect(filterKana(kanaData, "all", "all", "し").map((kana) => kana.id)).toEqual(["h-shi", "h-sha", "h-shu", "h-sho"])
    expect(filterKana(kanaData, "all", "all", "シ").map((kana) => kana.id)).toEqual(["k-shi", "k-sha", "k-shu", "k-sho"])
    expect(filterKana(kanaData, "all", "all", "not-a-kana")).toEqual([])
    expect(filterKana(kanaData, "all", "all", "  ")).toHaveLength(208)
  })

  it("intersects every script and category, including empty searches", () => {
    for (const script of ["all", "hiragana", "katakana"] as const) {
      for (const group of ["all", "basic", "dakuten", "handakuten", "combination"]) {
        const result = filterKana(kanaData, script, group, "")
        const perScript: Record<string, number> = { all: 104, basic: 46, dakuten: 20, handakuten: 5, combination: 33 }
        expect(result).toHaveLength(perScript[group] * (script === "all" ? 2 : 1))
        expect(result.every((kana) => script === "all" || kana.type === script)).toBe(true)
        expect(result.every((kana) => group === "all" || getCategoryGroup(kana.category) === group)).toBe(true)
        expect(filterKana(kanaData, script, group, "shi")).toEqual(result.filter((kana) => kana.romaji.includes("shi")))
        expect(filterKana(kanaData, script, group, "no match")).toEqual([])
      }
    }
  })
})

describe("quiz domain", () => {
  it("samples without mutation/repeated IDs or equivalent distractors and respects scope/count", () => {
    const original = [...kanaData]
    const questions = generateQuizQuestions(kanaData, { type: "katakana", questionCount: 25 }, () => 0.5)
    expect(questions).toHaveLength(25)
    expect(new Set(questions.map((q) => q.character.id)).size).toBe(25)
    for (const question of questions) {
      expect(question.character.type).toBe("katakana")
      expect(new Set(question.options).size).toBe(4)
      expect(question.options.filter((answer) => answer === question.correctAnswer)).toHaveLength(1)
    }
    expect(kanaData).toEqual(original)
    expect(generateQuizQuestions(kanaData, { type: "katakana", questionCount: 25 }, () => 0.5)).toEqual(questions)
  })

  it("handles empty, small, invalid and duplicate-answer pools with finite results", () => {
    const setup = { type: "all", questionCount: 10 } as const
    expect(generateQuizQuestions([], setup)).toEqual([])
    expect(generateQuizQuestions(kanaData, { ...setup, questionCount: NaN })).toEqual([])
    expect(generateQuizQuestions(kanaData, { ...setup, questionCount: 0 })).toEqual([])
    const one = generateQuizQuestions([kanaData[0]], setup)
    expect(one).toHaveLength(1)
    expect(one[0].options).toEqual(["a"])
    const duplicate = generateQuizQuestions([kanaData[0], { ...kanaData[0], id: "alternate-a" }, kanaData[1]], setup)
    expect(duplicate.every((q) => new Set(q.options).size === q.options.length)).toBe(true)
    expect(calculateQuizResults([], []).percentage).toBe(0)
    expect(calculateQuizResults(one, ["wrong"]).percentage).toBe(0)
    expect(calculateQuizResults(one, ["a"]).percentage).toBe(100)
    expect(calculateQuizResults(one, []).questions[0].userAnswer).toBe("")
  })
})
