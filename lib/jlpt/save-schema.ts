import { z } from "zod"
import { questionSchema } from "./schema"
import { levels } from "./types"
import type { JlptProgress } from "./learning"

const id = z.string().min(1).max(128)
const date = z.iso.datetime()
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const answer = z
  .object({
    choiceId: id,
    correct: z.boolean(),
    answeredAt: date,
    durationMs: z.number().int().min(0).max(86400000),
  })
  .strict()
export const practiceSessionSchema = z
  .object({
    id: z.uuid(),
    level: z.enum(levels),
    mode: z.enum(["practice", "review"]),
    questions: z.array(questionSchema).min(1).max(200),
    answers: z.array(answer.nullable()).min(1).max(200),
    index: count,
    startedAt: date,
    finishedAt: date.nullable(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (
      s.questions.length !== s.answers.length ||
      s.index >= s.questions.length ||
      new Set(s.questions.map((q) => q.id)).size !== s.questions.length ||
      s.questions.some((q) => q.level !== s.level) ||
      s.answers.some(
        (a, i) =>
          (i < s.index && !a) ||
          (i > s.index && Boolean(a)) ||
          (a &&
            (!s.questions[i]?.options.some((o) => o.id === a.choiceId) ||
              a.correct !== (a.choiceId === s.questions[i].answerId))),
      ) ||
      (s.finishedAt &&
        (s.answers.some((a) => !a) ||
          s.index !== s.questions.length - 1 ||
          s.finishedAt < s.startedAt))
    )
      ctx.addIssue({ code: "custom", message: "Invalid JLPT session lifecycle" })
  })
export const jlptProgressSchema = z
  .object({
    version: z.literal(1),
    revision: count,
    materials: z.record(
      id,
      z.object({ status: z.enum(["studying", "studied"]), updatedAt: date }).strict(),
    ),
    review: z.record(
      id,
      z
        .object({
          level: z.enum(levels),
          skill: z.enum(["moji-goi", "bunpou", "dokkai"]),
          materialId: id,
          nextReviewAt: date,
          streak: count,
          lastQuestionId: id,
        })
        .strict(),
    ),
    active: practiceSessionSchema.nullable(),
    history: z.array(practiceSessionSchema),
    lastActivity: z
      .object({
        href: z
          .string()
          .max(500)
          .regex(/^\/jlpt\/n[1-5](?:\/[a-zA-Z0-9_/?=&-]*)?$/),
        title: z.string().min(1).max(300),
        level: z.enum(levels),
        updatedAt: date,
      })
      .strict()
      .nullable(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (
      p.active?.finishedAt ||
      p.history.some((s) => !s.finishedAt) ||
      new Set(p.history.map((s) => s.id)).size !== p.history.length ||
      p.history.some((s) => s.id === p.active?.id) ||
      (p.lastActivity && !p.lastActivity.href.startsWith(`/jlpt/${p.lastActivity.level}`))
    ) {
      ctx.addIssue({ code: "custom", message: "Invalid JLPT history" })
    }
  })
export function parseJlptProgress(value: unknown): JlptProgress {
  return jlptProgressSchema.parse(value) as JlptProgress
}
