import type { Material, Question } from "./types"
const norm = (v: string) =>
  v
    .normalize("NFKC")
    .toLowerCase()
    .replace(/^to /, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
const glosses = (m: Material) => new Set(m.meaning.split(/[;,]/).map(norm).filter(Boolean))
function hash(v: string) {
  let n = 2166136261
  for (const c of v) n = Math.imul(n ^ c.charCodeAt(0), 16777619)
  return n >>> 0
}
function build(
  m: Material,
  pool: Material[],
  type: Question["type"],
  prompt: string,
  correct: string,
  label: (m: Material) => string | undefined,
  eligible: (m: Material) => boolean,
  explanation: string,
): Question | undefined {
  const options = [{ id: "correct", label: correct }],
    distractors: Record<string, string> = {},
    labels = new Set([norm(correct)]),
    start = hash(m.id + type) % pool.length
  for (let i = 0; i < pool.length && options.length < 4; i++) {
    const other = pool[(start + i) % pool.length],
      candidate = label(other)
    if (
      other.id === m.id ||
      other.title === m.title ||
      !candidate ||
      !eligible(other) ||
      labels.has(norm(candidate))
    )
      continue
    const id = `from-${other.id}`
    options.push({ id, label: candidate })
    labels.add(norm(candidate))
    distractors[id] =
      `This option comes from the source entry for ${other.title}${other.reading ? ` (${other.reading})` : ""}: ${other.meaning}. It does not match the requested entry or example.`
  }
  if (options.length < 2) return undefined
  const p = hash(m.id + type + "answer") % options.length
  ;[options[0], options[p]] = [options[p], options[0]]
  return {
    id: `${m.id}-${type}-v${m.version}`,
    version: m.version,
    level: m.level,
    skill: m.skill,
    type,
    materialId: m.id,
    conceptId: `${m.id}-sense-1`,
    variantGroup: `${m.id}-sense-1`,
    prompt,
    options,
    answerId: "correct",
    explanation,
    distractors,
    sourceIds: m.sourceIds,
    method: "source-derived",
    sourceRevision: m.provenance?.revision,
  }
}
/** Deterministic recognition drills from source fields, not official JLPT items. */
export function sourceQuestions(m: Material, pool: Material[]): Question[] {
  if (m.kind === "reading") return []
  const own = glosses(m),
    distinct = (other: Material) =>
      !(other.provenance?.jmdictId && other.provenance.jmdictId === m.provenance?.jmdictId) &&
      ![...glosses(other)].some((g) => own.has(g))
  const questions: (Question | undefined)[] = []
  if (m.kind === "vocabulary" && m.reading) {
    const accepted = new Set(
      pool.filter((o) => o.title === m.title).map((o) => norm(o.reading ?? "")),
    )
    questions.push(
      build(
        m,
        pool,
        "reading",
        `How is “${m.title}” read?\nSource meaning: ${m.meaning}`,
        m.reading,
        (o) => o.reading,
        (o) => !accepted.has(norm(o.reading ?? "")),
        `OpenJLPT records ${m.title} with the reading ${m.reading}. Source definition: ${m.meaning}.`,
      ),
    )
    questions.push(
      build(
        m,
        pool,
        "word-meaning",
        `Which source definition matches “${m.title}” (${m.reading})?`,
        m.meaning,
        (o) => o.meaning,
        distinct,
        `The source definition for ${m.title} (${m.reading}) is: ${m.meaning}.`,
      ),
    )
  } else if (m.kind === "grammar") {
    questions.push(
      build(
        m,
        pool,
        "grammar-meaning",
        `Which meaning belongs to “${m.title}”?`,
        m.meaning,
        (o) => o.meaning,
        distinct,
        `${m.meaning}.\nFormation: ${m.formation ?? "Not supplied"}.\n${m.explanation}`,
      ),
    )
    const e = m.examples[0]
    if (e)
      questions.push(
        build(
          m,
          pool,
          "example-translation",
          `Choose the source translation of this example:\n${e.japanese}`,
          e.translation,
          (o) => o.examples[0]?.translation,
          (o) => norm(o.examples[0]?.japanese ?? "") !== norm(e.japanese),
          `Source example: ${e.japanese}\nSource translation: ${e.translation}\nPattern: ${m.title} — ${m.meaning}.`,
        ),
      )
  }
  return questions.filter((q): q is Question => Boolean(q))
}
