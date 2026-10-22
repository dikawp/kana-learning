import { z } from "zod"
import { kanaSchema } from "../content/contracts"

export const MAX_HISTORY = 20
export const MAX_STUDY_CHARS = 262144
const question = z.object({ character: kanaSchema, options: z.array(z.string().min(1).max(40)).min(1).max(4), correctAnswer: z.string().min(1).max(40) }).strict()
  .refine((q) => q.correctAnswer === q.character.romaji && q.options.includes(q.correctAnswer) && new Set(q.options).size === q.options.length)
export const sessionSchema = z.object({
  id: z.string().uuid(), contentRevision: z.string().min(1).max(80),
  setup: z.object({ type: z.enum(["all", "hiragana", "katakana"]), questionCount: z.number().int().min(1).max(25) }).strict(),
  questions: z.array(question).min(1).max(25), answers: z.array(z.string().min(1).max(40)).max(25),
  position: z.number().int().min(0).max(24), createdAt: z.string().datetime(), completedAt: z.string().datetime().nullable(),
}).strict().superRefine((s, context) => {
  const invalid = s.questions.length > s.setup.questionCount || s.position >= s.questions.length ||
    new Set(s.questions.map((q) => q.character.id)).size !== s.questions.length ||
    s.questions.some((q) => s.setup.type !== "all" && q.character.type !== s.setup.type) ||
    s.answers.some((answer, index) => !s.questions[index]?.options.includes(answer)) ||
    (s.completedAt ? s.answers.length !== s.questions.length || s.position !== s.questions.length - 1 || s.completedAt < s.createdAt :
      s.answers.length < s.position || s.answers.length > s.position + 1)
  if (invalid) context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid quiz state" })
})
export const studySchema = z.object({ version: z.literal(1), active: sessionSchema.nullable(), history: z.array(sessionSchema).max(MAX_HISTORY) }).strict()
  .refine((s) => !s.active?.completedAt && s.history.every((entry) => entry.completedAt !== null) &&
    new Set([...s.history.map((entry) => entry.id), ...(s.active ? [s.active.id] : [])]).size === s.history.length + (s.active ? 1 : 0))
export type LocalQuiz = z.infer<typeof sessionSchema>
export type StudyState = z.infer<typeof studySchema>
