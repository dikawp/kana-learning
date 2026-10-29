import { expect, test, vi } from "vitest"
import fs from "node:fs"
import { checkLocalCorpus, loadCorpus, validateCorpus } from "../../scripts/jlpt/check"
import { sources, units } from "../../lib/jlpt/content"
import { questionSchema } from "../../lib/jlpt/schema"
import { levels, type MaterialSummary } from "../../lib/jlpt/types"
import catalog from "../../content/generated/catalog.json"
vi.mock("server-only", () => ({}))
import {
  getMaterial,
  getQuestions,
  getSources,
  getSummaries,
  getUnits,
  getLegacyMaterial,
} from "../../lib/jlpt/repository"
import { GET } from "../../app/api/jlpt/questions/route"

const summaries = levels.flatMap(
  (l) =>
    JSON.parse(
      fs.readFileSync(`content/jlpt/generated/${l}/summaries.json`, "utf8"),
    ) as MaterialSummary[],
)
const metadata = { sources, units, summaries, cards: catalog.cards }
test("imports every entry from the pinned corpus, with validated derivations and provenance", () => {
  expect(checkLocalCorpus()).toEqual({
    materials: 8342,
    vocabulary: 7811,
    grammar: 526,
    readings: 5,
    questions: 16684,
    units: 249,
  })
}, 20000)
test("source-backed repository retains level distinctions, examples, identity and old aliases", () => {
  expect(getSummaries()).toHaveLength(8342)
  expect(getSummaries("n1", "moji-goi")).toHaveLength(3070)
  expect(getSummaries("n5", "bunpou")).toHaveLength(81)
  expect(getSummaries(undefined, "choukai")).toEqual([])
  expect(getUnits("n3").length).toBeGreaterThan(40)
  const first = getSummaries("n5", "moji-goi")[0],
    material = getMaterial(first.id)!
  expect(material.provenance).toMatchObject({
    dataset: "OpenJLPT",
    jmdictId: 1198180,
    license: "CC-BY-SA-4.0",
  })
  expect(material.examples[0].sourceUrl).toMatch(/tatoeba.org\/en\/sentences\/show\//)
  expect(getQuestions("n5", [first.id])).toHaveLength(2)
  expect(getQuestions("n5", [])).toEqual([])
  expect(getQuestions("n5").length).toBeLessThanOrEqual(60)
  expect(getLegacyMaterial("jlpt-n5-hon")?.targetId).toMatch(/^jlpt-n5-v-/)
  expect(getLegacyMaterial("jlpt-n1-sessoku")?.targetId).toBeNull()
  expect(getSources(["openjlpt-grammar"])[0].revision).toMatch(/^[a-f0-9]{40}$/)
})
test("history schema remains compatible but rejects altered evidence and answers", () => {
  const q = getQuestions("n5", [getSummaries("n5", "moji-goi")[0].id])[0]
  expect(questionSchema.safeParse({ ...q, materialId: "retired-entry" }).success).toBe(true)
  expect(questionSchema.safeParse({ ...q, audioUrl: "unexpected" }).success).toBe(false)
  expect(questionSchema.safeParse({ ...q, answerId: "missing" }).success).toBe(false)
  expect(questionSchema.safeParse({ ...q, distractors: {} }).success).toBe(false)
  const reading = structuredClone(getQuestions("n5", ["jlpt-n5-library-note"])[0])
  reading.context!.blocks[0].text = "changed passage"
  expect(questionSchema.safeParse(reading).success).toBe(false)
})
test("validator rejects dangling kanji references and stale search summaries", () => {
  const corpus = loadCorpus()
  const bad = corpus.map((s, i) =>
    i
      ? s
      : {
          ...s,
          materials: s.materials.map((m, j) => (j ? m : { ...m, kanjiIds: ["kanji-invented"] })),
        },
  )
  expect(() => validateCorpus(bad, metadata)).toThrow(/Noncanonical/)
  const stale = {
    ...metadata,
    summaries: metadata.summaries.map((m, i) => (i ? m : { ...m, title: "stale" })),
  }
  expect(() => validateCorpus(corpus, stale)).toThrow(/Stale summary/)
}, 20000)
test("question endpoint bounds resource loading and rejects invalid levels and IDs", async () => {
  const id = getSummaries("n5", "moji-goi")[0].id
  const valid = GET(new Request(`http://localhost/api/jlpt/questions?level=n5&ids=${id}`))
  expect(valid.status).toBe(200)
  expect((await valid.json()).questions).toHaveLength(2)
  expect(GET(new Request(`http://localhost/api/jlpt/questions?level=n0&ids=${id}`)).status).toBe(
    400,
  )
  expect(GET(new Request("http://localhost/api/jlpt/questions?level=n5&ids=unknown")).status).toBe(
    404,
  )
  expect(
    GET(
      new Request(
        `http://localhost/api/jlpt/questions?level=n5&ids=${Array(41).fill(id).join(",")}`,
      ),
    ).status,
  ).toBe(400)
})
