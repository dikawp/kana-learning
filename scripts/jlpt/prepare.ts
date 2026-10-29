import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { levels, type Level, type Material, type Unit } from "../../lib/jlpt/types"
import { materialSchema } from "../../lib/jlpt/schema"

const upstream = path.join(process.cwd(), "content/jlpt/upstream/openjlpt")
const generated = path.join(process.cwd(), "content/jlpt/generated")
const manifest = JSON.parse(fs.readFileSync(path.join(upstream, "manifest.json"), "utf8")) as {
  revision: string
  files: { file: string; sha256: string }[]
}
for (const file of manifest.files)
  if (
    crypto
      .createHash("sha256")
      .update(fs.readFileSync(path.join(upstream, file.file)))
      .digest("hex") !== file.sha256
  )
    throw Error(`Upstream checksum mismatch: ${file.file}`)
const canonical = JSON.parse(fs.readFileSync("content/generated/catalog.json", "utf8")) as {
  cards: { id: string; kind: string; glyph: string }[]
}
const kanji = new Map(canonical.cards.filter((c) => c.kind === "kanji").map((c) => [c.glyph, c.id]))
const refs = (text: string) => [
  ...new Set([...text].flatMap((g) => (kanji.has(g) ? [kanji.get(g)!] : []))),
]
const reading = JSON.parse(fs.readFileSync("content/jlpt/readings.json", "utf8")) as {
  materials: Material[]
  units: Unit[]
  questions: unknown[]
}
const legacy = JSON.parse(fs.readFileSync("content/jlpt/legacy-map.json", "utf8")) as {
  id: string
  level: Level
  kind: string
  title: string
  reading: string
}[]
type Vocab = {
  id: string
  word: string
  reading: string
  romaji: string
  meanings: string[]
  level: string
  pos?: string[]
  jmdict_id?: number
  examples: { ja: string; en: string; furigana?: string; tatoeba_id?: number }[]
}
type Grammar = {
  id: string
  pattern: string
  romaji: string
  meaning: string
  formation: string
  tags: string[]
  notes: string
  level: string
  examples: { ja: string; en: string; furigana?: string }[]
}
const pos: Record<string, string> = {
  n: "noun",
  pn: "pronoun",
  num: "numeric",
  adv: "adverb",
  conj: "conjunction",
  ctr: "counter",
  exp: "expression",
  int: "interjection",
  pref: "prefix",
  suf: "suffix",
  prt: "particle",
  "adj-i": "i-adjective",
  "adj-ix": "i-adjective (yoi/ii)",
  "adj-na": "na-adjective",
  "adj-no": "no-adjective",
  "adj-f": "noun used before another noun",
  "adj-nari": "nari-adjective",
  "adj-pn": "prenominal adjective",
  "adj-t": "taru-adjective",
  "adv-to": "adverb taking to",
  aux: "auxiliary",
  "aux-adj": "auxiliary adjective",
  "aux-v": "auxiliary verb",
  "n-pref": "noun prefix",
  "n-suf": "noun suffix",
  v1: "ichidan verb",
  "v1-s": "ichidan verb (kureru)",
  vi: "intransitive verb",
  vt: "transitive verb",
  vk: "kuru verb",
  vs: "suru noun/verb",
  "vs-i": "suru verb",
  "vs-s": "special suru verb",
  vz: "zuru verb",
  v5aru: "godan verb (aru)",
  v5b: "godan verb (-bu)",
  v5g: "godan verb (-gu)",
  v5k: "godan verb (-ku)",
  "v5k-s": "godan verb (iku)",
  v5m: "godan verb (-mu)",
  v5n: "godan verb (-nu)",
  v5r: "godan verb (-ru)",
  "v5r-i": "irregular godan verb (-ru)",
  v5s: "godan verb (-su)",
  v5t: "godan verb (-tsu)",
  v5u: "godan verb (-u)",
  "v5u-s": "special godan verb (-u)",
}
function example(e: { ja: string; en: string; furigana?: string; tatoeba_id?: number }) {
  return {
    japanese: e.ja,
    reading: e.furigana ? e.furigana.replace(/\{([^|{}]+)\|([^{}]+)\}/g, "$2") : e.ja,
    translation: e.en,
    ...(e.furigana ? { furigana: e.furigana } : {}),
    ...(e.tatoeba_id
      ? {
          sourceId: `tatoeba-${e.tatoeba_id}`,
          sourceUrl: `https://tatoeba.org/en/sentences/show/${e.tatoeba_id}`,
        }
      : {}),
  }
}
const levelBasis =
  "Community JLPT mapping supplied by OpenJLPT, not an official exam list. Not independently language-reviewed by KanaLearn. Vocabulary levels do not certify example-sentence difficulty."
const all: Material[] = [],
  units: Unit[] = [],
  coverage: Record<
    string,
    {
      vocabulary: number
      grammar: number
      readings: number
      vocabularyWithExamples: number
      vocabularyWithoutPartOfSpeech: number
    }
  > = {}
fs.mkdirSync(generated, { recursive: true })
for (const level of levels) {
  const vocabulary = JSON.parse(
    fs.readFileSync(path.join(upstream, `data--json--vocab--${level}.json`), "utf8"),
  ) as Vocab[]
  const grammar = JSON.parse(
    fs.readFileSync(path.join(upstream, `data--json--grammar--${level}.json`), "utf8"),
  ) as Grammar[]
  const words: Material[] = vocabulary.map((v) => ({
    id: `jlpt-${level}-v-${v.id}`,
    version: 1,
    level,
    skill: "moji-goi",
    kind: "vocabulary",
    title: v.word,
    reading: v.reading,
    romaji: v.romaji,
    meaning: v.meanings.join("; "),
    objective: "Recognise this word, its reading and the source definitions.",
    tags: ["vocabulary", ...(v.pos ?? []).filter(Boolean)],
    sourceIds: [
      "openjlpt-vocabulary",
      "waller-jlpt",
      ...(v.jmdict_id ? ["edrdg-jmdict"] : []),
      ...((v.examples ?? []).some((e) => e.tatoeba_id) ? ["tatoeba-text"] : []),
    ],
    editorialStatus: "unreviewed",
    origin: "adapted",
    levelBasis,
    forms: [v.word],
    ...(v.pos?.filter(Boolean).length
      ? {
          partOfSpeech: v.pos
            .filter(Boolean)
            .map((p) => pos[p] ?? p)
            .join("; "),
        }
      : {}),
    explanation: v.meanings.map((meaning, i) => `${i + 1}. ${meaning}`).join("\n"),
    examples: (v.examples ?? []).map(example),
    kanjiIds: refs(v.word + (v.examples ?? []).map((e) => e.ja).join("")),
    relatedIds: [],
    provenance: {
      dataset: "OpenJLPT",
      entryId: v.id,
      revision: manifest.revision,
      url: `https://github.com/evanclan/OpenJLPT/blob/${manifest.revision}/data/json/vocab/${level}.json`,
      ...(v.jmdict_id ? { jmdictId: v.jmdict_id } : {}),
      license: "CC-BY-SA-4.0",
    },
  }))
  const patterns: Material[] = grammar.map((g) => ({
    id: `jlpt-${level}-g-${g.id}`,
    version: 1,
    level,
    skill: "bunpou",
    kind: "grammar",
    title: g.pattern,
    romaji: g.romaji,
    meaning: g.meaning,
    objective: "Understand the source meaning, formation and usage examples.",
    tags: g.tags.length ? g.tags : ["grammar"],
    sourceIds: ["openjlpt-grammar"],
    editorialStatus: "unreviewed",
    origin: "adapted",
    levelBasis,
    forms: [g.pattern],
    formation: g.formation,
    explanation: g.notes || g.meaning,
    examples: g.examples.map(example),
    kanjiIds: refs(g.pattern + g.examples.map((e) => e.ja).join("")),
    relatedIds: [],
    provenance: {
      dataset: "OpenJLPT",
      entryId: g.id,
      revision: manifest.revision,
      url: `https://github.com/evanclan/OpenJLPT/blob/${manifest.revision}/data/json/grammar/${level}.json`,
      license: "CC-BY-SA-4.0",
    },
  }))
  for (const m of patterns)
    m.relatedIds = patterns
      .filter((other) => other.id !== m.id && other.tags.some((t) => m.tags.includes(t)))
      .slice(0, 5)
      .map((other) => other.id)
  for (const group of [words, patterns]) {
    const size = group[0]?.kind === "grammar" ? 12 : 40
    for (let start = 0; start < group.length; start += size) {
      const chunk = group.slice(start, start + size),
        kind = chunk[0].kind
      units.push({
        id: `jlpt-${level}-${kind}-set-${Math.floor(start / size) + 1}`,
        level,
        title: `${kind === "grammar" ? "Grammar" : "Vocabulary"} study set ${Math.floor(start / size) + 1}`,
        objective:
          "Browse this source-ordered study set. The order is optional and does not imply official prerequisites.",
        materialIds: chunk.map((m) => m.id),
        prerequisites: [],
      })
    }
  }
  const original = reading.materials.filter((m) => m.level === level)
  const materials = [...words, ...patterns, ...original].map(
    (m) => materialSchema.parse(m) as Material,
  )
  fs.mkdirSync(path.join(generated, level), { recursive: true })
  fs.writeFileSync(path.join(generated, level, "materials.json"), JSON.stringify(materials) + "\n")
  const summaries = materials.map(
    ({
      id,
      version,
      level,
      skill,
      kind,
      title,
      meaning,
      objective,
      tags,
      sourceIds,
      editorialStatus,
      origin,
      levelBasis,
      reading,
      romaji,
      textType,
      blocks,
    }) => ({
      id,
      version,
      level,
      skill,
      kind,
      title,
      meaning,
      objective,
      tags,
      sourceIds,
      editorialStatus,
      origin,
      levelBasis,
      ...(reading ? { reading } : {}),
      ...(romaji ? { romaji } : {}),
      ...(textType ? { textType } : {}),
      ...(blocks ? { characterCount: blocks.reduce((n, b) => n + [...b.text].length, 0) } : {}),
    }),
  )
  fs.writeFileSync(path.join(generated, level, "summaries.json"), JSON.stringify(summaries) + "\n")
  coverage[level] = {
    vocabulary: words.length,
    grammar: patterns.length,
    readings: original.length,
    vocabularyWithExamples: words.filter((m) => m.examples.length).length,
    vocabularyWithoutPartOfSpeech: words.filter((m) => !m.partOfSpeech).length,
  }
  all.push(...materials)
}
const grammarAliases: Record<string, string> = {
  "jlpt-n5-te-kudasai": "te-kudasai",
  "jlpt-n5-temo-ii": "te-mo-ii",
  "jlpt-n4-ta-koto-ga-aru": "ta-koto-ga-aru",
  "jlpt-n4-nakereba-naranai": "nakereba-naranai-nakute-wa-ikenai",
  "jlpt-n3-you-ni-suru": "you-ni-suru",
  "jlpt-n3-koto-ni-natte-iru": "koto-ni-natte-iru",
  "jlpt-n2-nimo-kakawarazu": "ni-mo-kakawarazu",
  "jlpt-n2-ni-tomonatte": "ni-tomonatte",
  "jlpt-n1-wo-yoginaku-sareru": "o-yogi-naku-sareru",
  "jlpt-n1-made-mo-nai": "made-mo-nai",
}
const aliases = legacy.map((old) => {
  const candidates =
    old.kind === "vocabulary"
      ? all.filter(
          (m) => m.kind === "vocabulary" && m.title === old.title && m.reading === old.reading,
        )
      : all.filter((m) => m.kind === "grammar" && m.provenance?.entryId === grammarAliases[old.id])
  const target = candidates.find((m) => m.level === old.level) ?? candidates[0]
  return {
    id: old.id,
    level: old.level,
    skill: old.kind === "grammar" ? "bunpou" : "moji-goi",
    targetId: target?.id ?? null,
    targetLevel: target?.level ?? null,
    targetSkill: target?.skill ?? null,
  }
})
const aliasIndex = new Map(aliases.map((a) => [a.id, a.targetId]))
for (const original of reading.materials) {
  original.relatedIds = original.relatedIds.flatMap((id) =>
    aliasIndex.get(id) ? [aliasIndex.get(id)!] : [],
  )
  const file = path.join(generated, original.level, "materials.json"),
    materials = JSON.parse(fs.readFileSync(file, "utf8")) as Material[]
  materials[materials.findIndex((m) => m.id === original.id)] = materialSchema.parse(
    original,
  ) as Material
  fs.writeFileSync(file, JSON.stringify(materials) + "\n")
}
units.unshift(
  ...reading.units.map((unit) => ({
    ...unit,
    materialIds: unit.materialIds.flatMap((id) =>
      aliasIndex.has(id) ? (aliasIndex.get(id) ? [aliasIndex.get(id)!] : []) : [id],
    ),
  })),
)
fs.writeFileSync(path.join(generated, "units.json"), JSON.stringify(units, null, 2) + "\n")
fs.writeFileSync(path.join(generated, "aliases.json"), JSON.stringify(aliases, null, 2) + "\n")
fs.writeFileSync(
  path.join(generated, "progress-index.json"),
  JSON.stringify(all.map(({ id, level, skill }) => ({ id, level, skill }))) + "\n",
)
fs.writeFileSync(
  path.join(generated, "coverage.json"),
  JSON.stringify(
    {
      revision: manifest.revision,
      coverage,
      materials: all.length,
      vocabulary: all.filter((m) => m.kind === "vocabulary").length,
      grammar: all.filter((m) => m.kind === "grammar").length,
      readings: reading.materials.length,
      units: units.length,
    },
    null,
    2,
  ) + "\n",
)
fs.writeFileSync(
  "public/licenses/openjlpt-notice.txt",
  fs.readFileSync(path.join(upstream, "NOTICE.md")),
)
console.log(JSON.stringify({ materials: all.length, units: units.length, coverage }, null, 2))
