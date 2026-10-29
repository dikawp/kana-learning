import type { Level, MaterialSummary, Question, TextSkill } from "./types"
import { materialHref } from "./types"

export type MaterialProgress = { status: "studying" | "studied"; updatedAt: string }
export type ReviewState = {
  level: Level
  skill: TextSkill
  materialId: string
  nextReviewAt: string
  streak: number
  lastQuestionId: string
}
export type PracticeSession = {
  id: string
  level: Level
  mode: "practice" | "review"
  questions: Question[]
  answers: ({ choiceId: string; correct: boolean; answeredAt: string; durationMs: number } | null)[]
  index: number
  startedAt: string
  finishedAt: string | null
}
export type JlptProgress = {
  version: 1
  revision: number
  materials: Record<string, MaterialProgress>
  review: Record<string, ReviewState>
  active: PracticeSession | null
  history: PracticeSession[]
  lastActivity: { href: string; title: string; level: Level; updatedAt: string } | null
}
export const emptyProgress = (): JlptProgress => ({
  version: 1,
  revision: 0,
  materials: {},
  review: {},
  active: null,
  history: [],
  lastActivity: null,
})

export function markMaterial(
  progress: JlptProgress,
  material: MaterialSummary,
  status: "studying" | "studied",
  now = Date.now(),
): JlptProgress {
  const updatedAt = new Date(now).toISOString()
  // Reopening a completed lesson does not undo an explicit completion.
  const nextStatus = progress.materials[material.id]?.status === "studied" ? "studied" : status
  return {
    ...progress,
    materials: { ...progress.materials, [material.id]: { status: nextStatus, updatedAt } },
    lastActivity: {
      href: materialHref(material),
      title: material.title,
      level: material.level,
      updatedAt,
    },
  }
}

export function selectQuestions(
  progress: JlptProgress,
  questions: Question[],
  mode: "practice" | "review",
  now = Date.now(),
): Question[] {
  const candidates =
    mode === "review"
      ? questions.filter((q) => {
          const review = progress.review[q.conceptId]
          return review && Date.parse(review.nextReviewAt) <= now
        })
      : questions
  const groups = new Map<string, Question[]>()
  for (const q of candidates) {
    const group = groups.get(q.conceptId) ?? []
    group.push(q)
    groups.set(q.conceptId, group)
  }
  return [...groups.values()].map((group) => {
    const last = progress.review[group[0].conceptId]?.lastQuestionId
    return group.find((q) => q.id !== last) ?? group[0]
  })
}

export function beginSession(
  progress: JlptProgress,
  level: Level,
  questions: Question[],
  mode: "practice" | "review" = "practice",
  now = Date.now(),
): JlptProgress {
  const selected = selectQuestions(
    progress,
    questions.filter((q) => q.level === level),
    mode,
    now,
  )
  if (!selected.length) return progress
  const startedAt = new Date(now).toISOString()
  return {
    ...progress,
    active: {
      id: crypto.randomUUID(),
      level,
      mode,
      questions: structuredClone(selected),
      answers: selected.map(() => null),
      index: 0,
      startedAt,
      finishedAt: null,
    },
    lastActivity: {
      href: `/jlpt/${level}/${mode}`,
      title: `${level.toUpperCase()} ${mode}`,
      level,
      updatedAt: startedAt,
    },
  }
}

export function answerQuestion(
  progress: JlptProgress,
  sessionId: string,
  index: number,
  choiceId: string,
  durationMs: number,
  now = Date.now(),
): JlptProgress {
  const session = progress.active
  if (
    !session ||
    session.id !== sessionId ||
    session.index !== index ||
    session.finishedAt ||
    session.answers[index]
  )
    return progress
  const q = session.questions[index]
  if (!q || !q.options.some((o) => o.id === choiceId)) return progress
  const correct = q.answerId === choiceId
  const previous = progress.review[q.conceptId]
  const streak = correct ? (previous?.streak ?? 0) + 1 : 0
  const minutes = correct ? [1440, 4320, 10080][Math.min(streak - 1, 2)] : 10
  const answeredAt = new Date(now).toISOString()
  return {
    ...progress,
    active: {
      ...session,
      answers: session.answers.map((a, i) =>
        i === index
          ? {
              choiceId,
              correct,
              answeredAt,
              durationMs: Math.max(0, Math.min(86400000, Math.round(durationMs))),
            }
          : a,
      ),
    },
    review: {
      ...progress.review,
      [q.conceptId]: {
        level: q.level,
        skill: q.skill,
        materialId: q.materialId,
        nextReviewAt: new Date(now + minutes * 60000).toISOString(),
        streak,
        lastQuestionId: q.id,
      },
    },
    lastActivity: {
      href: `/jlpt/${session.level}/${session.mode}`,
      title: `${session.level.toUpperCase()} ${session.mode}`,
      level: session.level,
      updatedAt: answeredAt,
    },
  }
}

export function advanceSession(progress: JlptProgress, now = Date.now()): JlptProgress {
  const session = progress.active
  if (!session || !session.answers[session.index]) return progress
  if (session.index + 1 < session.questions.length)
    return { ...progress, active: { ...session, index: session.index + 1 } }
  const finishedAt = new Date(now).toISOString()
  return {
    ...progress,
    active: null,
    history: [{ ...session, finishedAt }, ...progress.history.filter((s) => s.id !== session.id)],
    lastActivity: {
      href: `/jlpt/${session.level}/results/${session.id}`,
      title: `${session.level.toUpperCase()} practice results`,
      level: session.level,
      updatedAt: finishedAt,
    },
  }
}

export function progressSummary(
  progress: JlptProgress,
  materials: Pick<MaterialSummary, "id">[],
  now = Date.now(),
) {
  const ids = new Set(materials.map((m) => m.id))
  const answers = progress.history.flatMap((s) =>
    s.questions.flatMap((q, i) => (ids.has(q.materialId) && s.answers[i] ? [s.answers[i]!] : [])),
  )
  const correct = answers.filter((a) => a.correct).length
  return {
    studied: materials.filter((m) => progress.materials[m.id]?.status === "studied").length,
    total: materials.length,
    due: Object.values(progress.review).filter(
      (r) => ids.has(r.materialId) && Date.parse(r.nextReviewAt) <= now,
    ).length,
    correct,
    answered: answers.length,
    accuracy: answers.length ? Math.round((correct / answers.length) * 100) : null,
  }
}
