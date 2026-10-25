import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
const kanaData = JSON.parse(readFileSync(new URL("../content/kana.json", import.meta.url), "utf8"))

const baseline = JSON.parse(
  readFileSync(new URL("./fixtures/kana-baseline-v1.json", import.meta.url), "utf8"),
)

test("all 208 kana IDs, glyphs, scripts and ordering match the frozen starting commit", () => {
  assert.equal(baseline.schemaVersion, 1)
  assert.equal(baseline.baselineCommit, "9bf0c966d039cf0716935693e10394f287a2a0a9")
  assert.equal(baseline.entries.length, 208)
  assert.equal(new Set(baseline.entries.map(({ id }) => id)).size, 208)
  assert.deepEqual(
    kanaData.map(({ id, character, type }) => ({ id, character, type })),
    baseline.entries,
  )
  for (const kana of kanaData) {
    assert.equal(typeof kana.romaji, "string")
    assert.ok(kana.romaji.length > 0)
    assert.equal("romanji" in kana, false)
  }
  for (const script of ["hiragana", "katakana"]) {
    assert.equal(kanaData.filter(({ type }) => type === script).length, 104)
  }
})
