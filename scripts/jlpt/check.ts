import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { pathToFileURL } from "node:url"
import { sources, units } from "../../lib/jlpt/content"
import { sourceQuestions } from "../../lib/jlpt/questions"
import { materialSchema, questionSchema, summarySchema, sourceSchema } from "../../lib/jlpt/schema"
import {
  levels,
  type Material,
  type MaterialSummary,
  type Question,
  type Source,
  type Unit,
} from "../../lib/jlpt/types"
const root = process.cwd(),
  generated = path.join(root, "content/jlpt/generated")
const json = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"))
export function loadCorpus() {
  const original = json(path.join(root, "content/jlpt/readings.json")) as { questions: Question[] }
  return levels.map((level) => {
    const materials = json(path.join(generated, level, "materials.json")) as Material[]
    const pools = {
      vocabulary: materials.filter((m) => m.kind === "vocabulary"),
      grammar: materials.filter((m) => m.kind === "grammar"),
    }
    const questions = materials.flatMap((m) =>
      m.kind === "reading"
        ? original.questions.filter((q) => q.materialId === m.id)
        : sourceQuestions(m, pools[m.kind]),
    )
    return { level, materials, questions }
  })
}
type Corpus = ReturnType<typeof loadCorpus>
export function validateCorpus(
  raw: Corpus,
  metadata: {
    sources: Source[]
    units: Unit[]
    summaries: MaterialSummary[]
    cards: { id: string; kind: string; glyph: string }[]
  },
) {
  metadata.sources.forEach((s) => sourceSchema.parse(s))
  const sourceIds = new Set(metadata.sources.map((s) => s.id)),
    materials = raw.flatMap((s) => s.materials),
    questions = raw.flatMap((s) => s.questions)
  const index = new Map(materials.map((m) => [m.id, m])),
    canonical = new Map(
      metadata.cards.filter((c) => c.kind === "kanji").map((c) => [c.id, c.glyph]),
    )
  assert.equal(index.size, materials.length, "Duplicate material IDs")
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length, "Duplicate question IDs")
  const summaries = new Map(metadata.summaries.map((m) => [m.id, summarySchema.parse(m)]))
  assert.equal(summaries.size, materials.length, "Missing or duplicate summaries")
  for (const m of materials) {
    materialSchema.parse(m)
    assert.equal(
      m.editorialStatus,
      "unreviewed",
      "No independent language review has been performed",
    )
    assert.ok(
      m.sourceIds.every((id) => sourceIds.has(id)),
      "Unknown material source",
    )
    assert.ok(
      m.kanjiIds.every((id) => canonical.has(id)),
      "Noncanonical kanji ID",
    )
    assert.ok(
      m.relatedIds.every((id) => index.has(id) && id !== m.id),
      "Broken related material",
    )
    const summary = summaries.get(m.id)
    assert.ok(summary, "Missing summary")
    for (const [key, value] of Object.entries(summary)) {
      const expected =
        key === "characterCount"
          ? (m.blocks ?? []).reduce((n, b) => n + [...b.text].length, 0)
          : m[key as keyof Material]
      assert.deepEqual(value, expected, `Stale summary ${m.id}.${key}`)
    }
    assert.ok(
      !/Penempatan editorial|belum ditinjau|Memahami |tidak sesuai|Baca teks|berarti paling/.test(
        [m.title, m.meaning, m.objective, m.explanation, m.translation ?? "", m.levelBasis].join(
          " ",
        ),
      ),
      "Indonesian content in live corpus",
    )
    if (m.kind !== "reading")
      assert.ok(
        m.provenance?.revision && m.provenance.license === "CC-BY-SA-4.0",
        "Missing imported provenance",
      )
  }
  for (const q of questions) {
    questionSchema.parse(q)
    const m = index.get(q.materialId)
    assert.ok(m, "Broken question material")
    assert.equal(q.level, m.level)
    assert.equal(q.skill, m.skill)
    assert.ok(
      q.sourceIds.every((id) => sourceIds.has(id)),
      "Unknown question source",
    )
    if (q.method === "source-derived") {
      assert.equal(q.sourceRevision, m.provenance?.revision, "Question source revision mismatch")
      assert.ok(
        ["reading", "word-meaning", "grammar-meaning", "example-translation"].includes(q.type),
        "Unsupported generated drill",
      )
      assert.ok(
        q.options.some((o) => o.id === q.answerId),
        "Missing correct option",
      )
    }
    if (q.evidence) {
      assert.ok(
        m.blocks?.find((b) => b.id === q.evidence!.blockId)?.text.includes(q.evidence.quote),
        "Evidence absent from source passage",
      )
      assert.deepEqual(q.context?.blocks, m.blocks, "Evidence context changed")
      assert.equal(q.context?.translation, m.translation)
    }
  }
  for (const unit of metadata.units) {
    assert.ok(
      unit.materialIds.length && unit.materialIds.every((id) => index.has(id)),
      "Broken unit reference",
    )
    assert.equal(new Set(unit.materialIds).size, unit.materialIds.length, "Repeated unit material")
  }
  assert.equal(
    new Set(metadata.units.map((u) => u.id)).size,
    metadata.units.length,
    "Duplicate unit IDs",
  )
  return {
    materials: materials.length,
    vocabulary: materials.filter((m) => m.kind === "vocabulary").length,
    grammar: materials.filter((m) => m.kind === "grammar").length,
    readings: materials.filter((m) => m.kind === "reading").length,
    questions: questions.length,
    units: metadata.units.length,
  }
}
export function checkLocalCorpus() {
  const manifest = json("content/jlpt/upstream/openjlpt/manifest.json") as {
    revision: string
    files: { file: string; sha256: string }[]
  }
  assert.match(manifest.revision, /^[a-f0-9]{40}$/)
  for (const f of manifest.files)
    assert.equal(
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(path.join(root, "content/jlpt/upstream/openjlpt", f.file)))
        .digest("hex"),
      f.sha256,
      `Upstream checksum mismatch: ${f.file}`,
    )
  const corpus = loadCorpus(),
    counts = validateCorpus(corpus, {
      sources,
      units,
      summaries: levels.flatMap((l) => json(path.join(generated, l, "summaries.json"))),
      cards: json("content/generated/catalog.json").cards,
    })
  const upstreamMeta = json("content/jlpt/upstream/openjlpt/data--json--meta.json")
  for (const shard of corpus) {
    assert.equal(
      shard.materials.filter((m) => m.kind === "vocabulary").length,
      upstreamMeta.counts.vocab[shard.level.toUpperCase()],
    )
    assert.equal(
      shard.materials.filter((m) => m.kind === "grammar").length,
      upstreamMeta.counts.grammar[shard.level.toUpperCase()],
    )
  }
  assert.equal(counts.vocabulary, upstreamMeta.counts.vocab.total)
  assert.equal(counts.grammar, upstreamMeta.counts.grammar.total)
  const progressIndex = json(path.join(generated, "progress-index.json")) as { id: string }[]
  assert.deepEqual(
    progressIndex.map((m) => m.id),
    corpus.flatMap((s) => s.materials.map((m) => m.id)),
  )
  const aliases = json(path.join(generated, "aliases.json")) as {
    id: string
    targetId: string | null
  }[]
  const ids = new Set(progressIndex.map((m) => m.id))
  assert.ok(aliases.every((a) => a.targetId === null || ids.has(a.targetId)))
  assert.ok(fs.existsSync("public/licenses/openjlpt-notice.txt"))
  return counts
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(checkLocalCorpus(), null, 2))
  console.log(
    "Complete pinned OpenJLPT vocabulary/grammar snapshot validated. Reading exercises remain original and unreviewed; listening/audio are held.",
  )
}
