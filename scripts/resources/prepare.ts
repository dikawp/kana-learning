import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import kana from "../../content/kana.json"
import type { StudyCard, Deck, StudySet } from "../../lib/platform/types"

const require = createRequire(import.meta.url)
const api = require("kanji-data") as {
  getJlpt: (level: number) => string[]
  getWords: (glyph: string) => {
    variants: { written: string; pronounced: string; priorities: string[] }[]
    meanings: { glosses: string[] }[]
  }[]
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const packageRoot = path.dirname(require.resolve("kanji-data/package.json"))
type Meta = {
  kanji: string
  meanings: string[]
  kun_readings: string[]
  on_readings: string[]
  name_readings: string[]
  stroke_count: number
  grade: number | null
  jlpt: number | null
  freq_mainichi_shinbun: number | null
}
const source = fs.readFileSync(path.join(packageRoot, "data/kanji-meta.json"))
const hash = (s: string | Buffer) => crypto.createHash("sha256").update(s).digest("hex")
const all = Object.values(JSON.parse(source.toString()) as Record<string, Meta>)
const school = (m: Meta) => (m.grade !== null && (m.grade <= 6 || m.grade === 8) ? m.grade : 99)
const originalSelection = all
  .filter((m) => m.meanings.length && (m.on_readings.length || m.kun_readings.length))
  .sort(
    (a, b) =>
      school(a) - school(b) ||
      (a.freq_mainichi_shinbun ?? 999999) - (b.freq_mainichi_shinbun ?? 999999) ||
      a.kanji.codePointAt(0)! - b.kanji.codePointAt(0)!,
  )
  .slice(0, 2681)
const levels = [5, 4, 3, 2, 1]
const levelLists = new Map(levels.map((level) => [level, [...new Set(api.getJlpt(level))]]))
const levelByGlyph = new Map<string, number>()
const metadataByGlyph = new Map(all.map((m) => [m.kanji, m]))
const selected = [...originalSelection],
  selectedGlyphs = new Set(selected.map((m) => m.kanji))
for (const level of levels) {
  const list = levelLists.get(level)!
  if (!list.length) throw Error(`Missing source list N${level}`)
  for (const glyph of list) {
    if (levelByGlyph.has(glyph) && levelByGlyph.get(glyph) !== level)
      throw Error(`Conflicting JLPT assignment: ${glyph}`)
    levelByGlyph.set(glyph, level)
    const m = metadataByGlyph.get(glyph)
    if (!m || !m.meanings.length || !(m.on_readings.length || m.kun_readings.length))
      throw Error(`Incomplete JLPT source card: ${glyph}`)
    if (!selectedGlyphs.has(glyph)) {
      selected.push(m)
      selectedGlyphs.add(glyph)
    }
  }
}

const kanji: StudyCard[] = selected.map((m) => {
  const words = api
    .getWords(m.kanji)
    .map((w) => ({
      variant: w.variants.find((v) => v.written.includes(m.kanji)),
      meanings: [...new Set(w.meanings.flatMap((s) => s.glosses))],
    }))
    .filter((w) => w.variant && w.meanings.length)
    .sort(
      (a, b) =>
        Number(Boolean(b.variant!.priorities.length)) -
          Number(Boolean(a.variant!.priorities.length)) ||
        a.variant!.written.length - b.variant!.written.length,
    )
  const seen = new Set<string>()
  return {
    id: `kanji-${m.kanji.codePointAt(0)!.toString(16)}`,
    glyph: m.kanji,
    kind: "kanji",
    meanings: m.meanings,
    readings: [...m.on_readings, ...m.kun_readings],
    on: m.on_readings,
    kun: m.kun_readings,
    names: m.name_readings,
    strokes: m.stroke_count ?? null,
    grade: m.grade ?? null,
    jlpt: levelByGlyph.get(m.kanji) ?? null,
    frequency: m.freq_mainichi_shinbun ?? null,
    words: words
      .filter((w) => {
        const key = w.variant!.written
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)
      .map((w) => ({
        written: w.variant!.written,
        reading: w.variant!.pronounced,
        meanings: w.meanings,
      })),
  }
})
const group = (s: string) =>
  s.includes("handakuten")
    ? "handakuten"
    : s.includes("dakuten")
      ? "dakuten"
      : s.includes("combinations")
        ? "combinations"
        : "basic"
const cards: StudyCard[] = [
  ...kana.map((k) => ({
    id: k.id,
    glyph: k.character,
    kind: k.type as "hiragana" | "katakana",
    meanings: [k.romaji],
    readings: [k.romaji],
    romaji: k.romaji,
    group: group(k.category),
    on: [],
    kun: [],
    names: [],
    strokes: null,
    grade: null,
    jlpt: null,
    frequency: null,
    words: [],
  })),
  ...kanji,
]
// Existing cards/deck memberships remain unchanged. Newly admitted characters
// receive dedicated JLPT decks instead of shifting the original reading trails.
const originalKanji = kanji.slice(0, originalSelection.length)
// Topic decks are keyword-selected introductions. Reading trails explicitly supply
// frequency-ranked coverage, rather than pretending every character is thematic.
const definitions = JSON.parse(
  fs.readFileSync(path.join(root, "content/curriculum.json"), "utf8"),
) as {
  slug: string
  title: string
  symbol: string
  description: string
  trails: number
  topics: { title: string; keywords: string[]; glyphs?: string }[]
}[]
const decks: Deck[] = [],
  sets: StudySet[] = []
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
const totalTrails = definitions.reduce((n, s) => n + s.trails, 0)
// Whole-word matches prevent e.g. "will" selecting willow, "ear" selecting
// earn, or "old" selecting cold. Only explicitly declared stems are expanded.
const stems = new Set(["communicat", "celebrat", "beaut", "govern"])
const keywordMatch = (text: string, keyword: string) =>
  new RegExp(
    `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${stems.has(keyword) ? "[a-z]*" : "(?:s|es|ed|ing)?"}\\b`,
    "i",
  ).test(text)
let trailIndex = 0
for (const def of definitions) {
  const entries: Deck[] = def.topics.map((t) => {
    const keywords = t.keywords.map((s) => s.toLowerCase())
    const ranked = originalKanji
      .map((c) => ({
        c,
        score:
          (t.glyphs?.includes(c.glyph) ? 100000 - t.glyphs.indexOf(c.glyph) * 1000 : 0) +
          c.meanings.reduce(
            (n, m) => n + keywords.filter((k) => keywordMatch(m, k)).length * 100,
            0,
          ) +
          c.words.reduce(
            (n, w) => n + keywords.filter((k) => w.meanings.some((m) => keywordMatch(m, k))).length,
            0,
          ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || originalKanji.indexOf(a.c) - originalKanji.indexOf(b.c))
    if (ranked.length < 10)
      throw Error(`Not enough supported topic cards: ${t.title} (${ranked.length})`)
    const members = ranked.slice(0, Math.min(40, ranked.length)).map((x) => x.c.id)
    return {
      slug: `${def.slug}-${slugify(t.title)}`,
      set: def.slug,
      title: t.title,
      description: `Explore ${keywords.join(", ")} through dictionary meanings and useful words. Editorial starting characters are followed by source-backed word matches.`,
      kind: "kanji",
      cardIds: members,
      method: "topic",
    }
  })
  for (let i = 0; i < def.trails; i++, trailIndex++) {
    const from = Math.floor((trailIndex * originalKanji.length) / totalTrails),
      to = Math.floor(((trailIndex + 1) * originalKanji.length) / totalTrails)
    entries.push({
      slug: `${def.slug}-reading-trail-${i + 1}`,
      set: def.slug,
      title: `${def.title}: Reading Trail ${i + 1}`,
      description: `A consolidation trail beyond this set's thematic introductions. School-grade and newspaper-frequency order, positions ${from + 1}–${to}; not a thematic classification.`,
      kind: "kanji",
      cardIds: originalKanji.slice(from, to).map((c) => c.id),
      method: "reading-trail",
    })
  }
  decks.push(...entries)
  sets.push({
    slug: def.slug,
    title: def.title,
    symbol: def.symbol,
    kind: "kanji",
    description: def.description,
    decks: entries.map((d) => d.slug),
  })
}
for (const kind of ["hiragana", "katakana"] as const) {
  const entries: Deck[] = ["basic", "dakuten", "handakuten", "combinations"].map((g) => ({
    slug: `${kind}-${g}`,
    set: kind,
    title: `${kind === "hiragana" ? "Hiragana" : "Katakana"} ${g[0].toUpperCase() + g.slice(1)}`,
    description:
      g === "basic"
        ? "Build a foundation in the basic sounds, one character at a time."
        : `Practice ${g} sounds and their Romaji readings.`,
    kind,
    cardIds: cards.filter((c) => c.kind === kind && c.group === g).map((c) => c.id),
    method: "kana",
  }))
  decks.push(...entries)
  sets.unshift({
    slug: kind,
    title: kind === "hiragana" ? "Hiragana Garden" : "Katakana Studio",
    symbol: kind === "hiragana" ? "あ" : "ア",
    kind,
    description:
      "From basic sounds to voiced marks and combinations. All 104 entries, with a reference table.",
    decks: entries.map((d) => d.slug),
  })
}
for (const level of levels) {
  const slug = `jlpt-n${level}`
  const members = kanji.filter((c) => c.jlpt === level)
  const parts = Math.ceil(members.length / 60)
  const entries: Deck[] = Array.from({ length: parts }, (_, i) => ({
    slug: `${slug}-part-${i + 1}`,
    set: slug,
    title: `JLPT N${level} · Part ${i + 1}`,
    description: `Study cards assigned to approximate N${level} by kanji-data 1.0.0. Part ${i + 1} of ${parts}. This source-level grouping is not an official exam specification and excludes other levels.`,
    kind: "kanji",
    method: "jlpt",
    cardIds: members
      .slice(
        Math.floor((i * members.length) / parts),
        Math.floor(((i + 1) * members.length) / parts),
      )
      .map((c) => c.id),
  }))
  decks.push(...entries)
  sets.push({
    slug,
    title: `JLPT N${level}`,
    symbol: ["", "一", "二", "三", "四", "五"][level],
    kind: "kanji",
    description: `${members.length} source-mapped kanji, divided into ${parts} manageable study decks. Approximate level labels; not cumulative or an official JLPT list.`,
    decks: entries.map((d) => d.slug),
  })
}
if (
  cards.length !== 2967 ||
  sets.length !== 19 ||
  decks.length !== 162 ||
  new Set(decks.flatMap((d) => d.cardIds)).size !== cards.length
)
  throw Error("Catalog coverage/count invariant failed")
for (const d of decks.filter((d) => d.kind === "kanji"))
  if (d.cardIds.length < 10 || d.cardIds.length > 60) throw Error(`Invalid deck size: ${d.slug}`)
const summaries = cards.map(({ id, glyph, kind, meanings, readings, group, jlpt }) => ({
  id,
  glyph,
  kind,
  meanings,
  readings,
  jlpt,
  ...(group ? { group } : {}),
}))
const revision = hash(JSON.stringify({ cards, sets, decks }))
const out = path.join(root, "content/generated")
fs.mkdirSync(out, { recursive: true })
const write = (name: string, value: unknown) =>
  fs.writeFileSync(path.join(out, name), JSON.stringify(value) + "\n")
write("catalog.json", { revision, cards: summaries, sets, decks })
write("cards.json", cards)
const jlptCoverage = levels.map((level) => ({
  level,
  source: levelLists.get(level)!.length,
  available: kanji.filter((c) => c.jlpt === level).length,
  missing: levelLists.get(level)!.filter((glyph) => !selectedGlyphs.has(glyph)),
}))
if (jlptCoverage.some((c) => c.missing.length || c.available !== c.source))
  throw Error("JLPT coverage invariant failed")
write("source.json", {
  package: "kanji-data",
  version: "1.0.0",
  metadataSha256: hash(source),
  revision,
  cards: cards.length,
  kanji: kanji.length,
  kana: kana.length,
  sets: sets.length,
  decks: decks.length,
  jlptCoverage,
  dataLicense: "CC-BY-SA-4.0",
  source: "https://github.com/sepTN/kanji-data",
  original: "https://www.edrdg.org/",
  attribution: "James William Breen and EDRDG; kanjiapi.dev; kanji-data by Septian Ganendra S. K.",
  selection:
    "Original 2681 school-grade/frequency/Unicode cards retained, plus all missing source N5–N1 cards. Original memberships retained; dedicated source-mapped JLPT decks added. Labels are approximate, not official exam specifications.",
})
console.log(
  `Prepared ${cards.length} cards, ${sets.length} sets, ${decks.length} decks. Revision ${revision}`,
)
