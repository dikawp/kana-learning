import type { StudyCard } from "./types"

export type Mode = "flashcards" | "quiz" | "review"
type Rating = "again" | "learning" | "known"
type Progress = {
  state: Rating
  encounters: number
  correct: number
  wrong: number
  lastPracticedAt: string
  nextReviewAt: string
}
type Question = {
  prompt: string
  answerId: string
  options: { id: string; label: string }[]
  kind: "glyph" | "reading" | "meaning"
}
type Session = {
  id: string
  deck: string
  revision: string
  mode: Mode
  cards: StudyCard[]
  questions: Question[]
  answers: (Rating | null)[]
  choices: (string | null)[]
  index: number
  startedAt: string
  finishedAt: string | null
}
export type Slot = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  cards: Record<string, Progress>
  active: Session | null
  history: Session[]
}

function shuffle<T>(values: T[], random = Math.random): T[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
const norm = (s: string) => s.normalize("NFKC").trim().toLowerCase()
export function makeQuestion(
  card: StudyCard,
  pool: StudyCard[],
  index: number,
  random = Math.random,
): Question {
  const kind =
    card.kind !== "kanji"
      ? index % 2
        ? "reading"
        : "glyph"
      : (["meaning", "glyph", "reading"] as const)[index % 3]
  const label = (c: StudyCard) => (kind === "glyph" ? (c.romaji ?? c.meanings[0]) : c.glyph)
  const prompt =
    kind === "glyph"
      ? card.glyph
      : kind === "reading"
        ? (card.romaji ?? card.readings[0])
        : card.meanings.slice(0, 2).join(", ")
  const labels = new Set([norm(label(card))])
  const options = [{ id: card.id, label: label(card) }]
  for (const c of shuffle(pool, random)) {
    if (c.id === card.id || c.kind !== card.kind || labels.has(norm(label(c)))) continue
    // Shared accepted readings/meanings cannot be a wrong glyph answer.
    if (
      kind === "reading" &&
      c.readings.some((r) => card.readings.some((a) => norm(a) === norm(r)))
    )
      continue
    if (
      (kind === "meaning" || kind === "glyph") &&
      !card.romaji &&
      c.meanings.some((m) => card.meanings.some((a) => norm(a) === norm(m)))
    )
      continue
    labels.add(norm(label(c)))
    options.push({ id: c.id, label: label(c) })
    if (options.length === 4) break
  }
  return { prompt, answerId: card.id, options: shuffle(options, random), kind }
}
export function startSession(
  slot: Slot,
  deck: string,
  revision: string,
  mode: Mode,
  cards: StudyCard[],
  now = Date.now(),
  random = Math.random,
): Session {
  const due = (c: StudyCard) => {
    const p = slot.cards[c.id]
    return p
      ? p.state === "again"
        ? 0
        : Date.parse(p.nextReviewAt) <= now
          ? 1
          : p.state === "learning"
            ? 2
            : 3
      : 4
  }
  let queue = shuffle(cards, random).sort((a, b) => due(a) - due(b))
  if (mode === "review") queue = queue.filter((c) => slot.cards[c.id] && due(c) <= 2)
  if (mode === "quiz") queue = queue.slice(0, 20)
  return {
    id: crypto.randomUUID(),
    deck,
    revision,
    mode,
    cards: queue,
    questions: queue.map((c, i) => makeQuestion(c, cards, i, random)),
    answers: queue.map(() => null),
    choices: queue.map(() => null),
    index: 0,
    startedAt: new Date(now).toISOString(),
    finishedAt: null,
  }
}
export function rate(
  slot: Slot,
  sessionId: string,
  index: number,
  rating: Rating,
  now = Date.now(),
  choice: string | null = null,
): Slot {
  const active = slot.active
  if (
    !active ||
    active.id !== sessionId ||
    active.index !== index ||
    active.answers[index] !== null ||
    active.finishedAt
  )
    return slot
  const card = active.cards[index],
    previous = slot.cards[card.id]
  const correct = Number(rating !== "again"),
    minutes = rating === "again" ? 10 : rating === "learning" ? 1440 : 4320
  const progress: Progress = {
    state: rating,
    encounters: (previous?.encounters ?? 0) + 1,
    correct: (previous?.correct ?? 0) + correct,
    wrong: (previous?.wrong ?? 0) + 1 - correct,
    lastPracticedAt: new Date(now).toISOString(),
    nextReviewAt: new Date(now + minutes * 60000).toISOString(),
  }
  return {
    ...slot,
    updatedAt: new Date(now).toISOString(),
    cards: { ...slot.cards, [card.id]: progress },
    active: {
      ...active,
      answers: active.answers.map((a, i) => (i === index ? rating : a)),
      choices: active.choices.map((a, i) => (i === index ? choice : a)),
    },
  }
}
export function advance(slot: Slot, now = Date.now()): Slot {
  const s = slot.active
  if (!s || s.answers[s.index] === null) return slot
  if (s.index + 1 < s.cards.length) return { ...slot, active: { ...s, index: s.index + 1 } }
  const completed = { ...s, finishedAt: new Date(now).toISOString() }
  return {
    ...slot,
    active: null,
    history: [completed, ...slot.history.filter((h) => h.id !== s.id)].slice(0, 20),
  }
}
export function levelFor(exp: number) {
  let level = 1,
    current = Math.max(0, exp)
  const required = (l: number) => Math.floor(20 + l * 2.5 + l ** 1.35)
  while (current >= required(level)) {
    current -= required(level)
    level++
  }
  return { level, current, required: required(level) }
}
export function stats(slot: Slot, ids = Object.keys(slot.cards), now = Date.now()) {
  const entries = ids.map((id) => slot.cards[id]).filter(Boolean)
  const correct = entries.reduce((n, p) => n + p.correct, 0),
    encounters = entries.reduce((n, p) => n + p.encounters, 0)
  return {
    seen: entries.length,
    known: entries.filter((p) => p.state === "known").length,
    mastered: entries.filter((p) => p.correct >= 100).length,
    due: entries.filter((p) => Date.parse(p.nextReviewAt) <= now).length,
    correct,
    encounters,
    accuracy: encounters ? Math.round((correct / encounters) * 100) : null,
  }
}

export function result(s: Session) {
  const correct = s.answers.filter((a) => a && a !== "again").length
  return { correct, total: s.cards.length, accuracy: Math.round((correct / s.cards.length) * 100) }
}
