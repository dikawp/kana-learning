import { expect, test } from "vitest"
import { romanizeReading } from "../../lib/platform/romaji"

test.each([
  ["ニチ", "nichi"],
  ["ジツ", "jitsu"],
  ["ひ", "hi"],
  ["-び", "-bi"],
  ["た.べる", "ta.beru"],
  ["がっこう", "gakkou"],
  ["きょう", "kyou"],
  ["しんよう", "shin'you"],
  ["にほん", "nihon"],
  ["", ""],
])("romanizes source reading %s as %s", (kana, expected) => {
  expect(romanizeReading(kana)).toBe(expected)
})
