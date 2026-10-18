import { createHash } from "node:crypto"
import { and, asc, desc, eq, lt, or, sql } from "drizzle-orm"
import type { PgDatabase, PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core"
import type { ExtractTablesWithRelations } from "drizzle-orm"
import * as schema from "../db/schema"
import { generateQuizQuestions } from "../../lib/kana/quiz"
import { ApiError } from "../api/errors"
import type { QuizSetup } from "../../types/kana"
import type { AccountQuiz, QuizSummary } from "../../lib/account/contracts"

export type LearningDatabase = PgDatabase<PgQueryResultHKT, typeof schema>
type Transaction = PgTransaction<PgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>
const { profiles, kana, familiarity, quizSessions, quizQuestions, quizAnswers, mutationReceipts } = schema

function payloadHash(value: unknown): string {
  const canonical = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(canonical)
    if (item !== null && typeof item === "object") return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)]))
    return item
  }
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex")
}

async function receipt<T>(tx: Transaction, owner: string, key: string, operation: string, payload: unknown, run: () => Promise<T>): Promise<T> {
  const hash = payloadHash(payload)
  const [previous] = await tx.select().from(mutationReceipts).where(and(eq(mutationReceipts.profileId, owner), eq(mutationReceipts.requestId, key)))
  if (previous) {
    if (previous.operation !== operation || previous.payloadHash !== hash) throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "This request ID was already used for a different operation.")
    return previous.result as T
  }
  const result = await run()
  await tx.insert(mutationReceipts).values({ profileId: owner, requestId: key, operation, payloadHash: hash, result })
  return result
}

function summary(row: typeof quizSessions.$inferSelect): QuizSummary {
  return { id: row.id, config: row.config, status: row.status, total: row.total, score: row.score, createdAt: row.createdAt.toISOString(), completedAt: row.completedAt?.toISOString() ?? null }
}

export function createLearningService(db: LearningDatabase) {
  async function account<T>(owner: string, action: (tx: Transaction) => Promise<T>) {
    return db.transaction(async (tx) => {
      // Transaction-local claims never leak between pooled requests. SQL role must not bypass RLS.
      await tx.execute(sql`select set_config('app.profile_id', ${owner}, true)`)
      await tx.insert(profiles).values({ id: owner }).onConflictDoNothing()
      // Serialize mutations for this account, including idempotency keys shared across quiz sessions.
      await tx.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, owner)).for("update")
      return action(tx)
    })
  }
  async function findSession(tx: Transaction, owner: string, id: string) {
    const [session] = await tx.select().from(quizSessions).where(and(eq(quizSessions.id, id), eq(quizSessions.profileId, owner)))
    if (!session) throw new ApiError(404, "QUIZ_NOT_FOUND", "Quiz session was not found.")
    return session
  }
  async function quizView(tx: Transaction, owner: string, id: string): Promise<AccountQuiz> {
    const session = await findSession(tx, owner, id)
    const questions = await tx.select().from(quizQuestions).where(and(eq(quizQuestions.sessionId, id), eq(quizQuestions.profileId, owner))).orderBy(asc(quizQuestions.position))
    const answers = await tx.select().from(quizAnswers).where(and(eq(quizAnswers.sessionId, id), eq(quizAnswers.profileId, owner)))
    return { ...summary(session), questions: questions.map((question) => {
      const answer = answers.find((entry) => entry.questionId === question.id)
      return { id: question.id, kanaId: question.kanaId, character: question.snapshot.character, type: question.snapshot.type, options: question.options,
        feedback: answer ? { answer: answer.answer, isCorrect: answer.isCorrect, correctAnswer: question.correctAnswer } : null }
    }) }
  }
  return {
    async content() {
      return db.select({ id: kana.id, character: kana.character, romaji: kana.romaji, type: kana.type, category: kana.category }).from(kana).orderBy(asc(kana.position))
    },
    progress(owner: string) {
      return account(owner, async (tx) => ({ learnedIds: (await tx.select({ id: familiarity.kanaId }).from(familiarity).where(eq(familiarity.profileId, owner)).orderBy(asc(familiarity.kanaId))).map((row) => row.id) }))
    },
    setFamiliar(owner: string, key: string, kanaId: string, familiar: boolean) {
      return account(owner, (tx) => receipt(tx, owner, key, "familiarity:v1", { kanaId, familiar }, async () => {
        const [entry] = await tx.select({ id: kana.id }).from(kana).where(eq(kana.id, kanaId))
        if (!entry) throw new ApiError(422, "UNKNOWN_KANA", "Kana entry does not exist.")
        if (familiar) await tx.insert(familiarity).values({ profileId: owner, kanaId }).onConflictDoNothing()
        else await tx.delete(familiarity).where(and(eq(familiarity.profileId, owner), eq(familiarity.kanaId, kanaId)))
        return { kanaId, familiar }
      }))
    },
    reset(owner: string, key: string, type: "all" | "hiragana" | "katakana") {
      return account(owner, (tx) => receipt(tx, owner, key, "reset-familiarity:v1", { type }, async () => {
        if (type === "all") await tx.delete(familiarity).where(eq(familiarity.profileId, owner))
        else {
          const entries = await tx.select({ id: kana.id }).from(kana).where(eq(kana.type, type))
          for (const entry of entries) await tx.delete(familiarity).where(and(eq(familiarity.profileId, owner), eq(familiarity.kanaId, entry.id)))
        }
        return { reset: type }
      }))
    },
    startQuiz(owner: string, key: string, config: QuizSetup) {
      return account(owner, (tx) => receipt(tx, owner, key, "start-quiz:v1", config, async () => {
        const pool = await tx.select().from(kana).orderBy(asc(kana.position))
        const questions = generateQuizQuestions(pool, config)
        if (!questions.length) throw new ApiError(422, "EMPTY_QUIZ", "No kana are available for this quiz.")
        const [session] = await tx.insert(quizSessions).values({ profileId: owner, config, total: questions.length }).returning()
        await tx.insert(quizQuestions).values(questions.map((question, position) => ({
          sessionId: session.id, profileId: owner, kanaId: question.character.id, position,
          snapshot: { id: question.character.id, character: question.character.character, romaji: question.character.romaji, type: question.character.type, category: question.character.category },
          options: question.options, correctAnswer: question.correctAnswer,
        })))
        return quizView(tx, owner, session.id)
      }))
    },
    quiz(owner: string, id: string) { return account(owner, (tx) => quizView(tx, owner, id)) },
    answer(owner: string, key: string, sessionId: string, questionId: string, answer: string) {
      return account(owner, (tx) => receipt(tx, owner, key, "answer:v1", { sessionId, questionId, answer }, async () => {
        const session = await findSession(tx, owner, sessionId)
        const [question] = await tx.select().from(quizQuestions).where(and(eq(quizQuestions.id, questionId), eq(quizQuestions.sessionId, sessionId), eq(quizQuestions.profileId, owner)))
        if (!question) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question was not issued for this quiz.")
        const [previous] = await tx.select().from(quizAnswers).where(and(eq(quizAnswers.questionId, questionId), eq(quizAnswers.profileId, owner)))
        if (previous) {
          if (previous.answer !== answer) throw new ApiError(409, "ANSWER_ALREADY_ACCEPTED", "An answer was already accepted for this question.")
          return { answer: previous.answer, isCorrect: previous.isCorrect, correctAnswer: question.correctAnswer }
        }
        if (session.status !== "active") throw new ApiError(409, "QUIZ_COMPLETED", "This quiz is already completed.")
        if (!question.options.includes(answer)) throw new ApiError(422, "INVALID_OPTION", "Choose an issued answer option.")
        const isCorrect = answer === question.correctAnswer
        await tx.insert(quizAnswers).values({ questionId, sessionId, profileId: owner, submissionId: key, answer, isCorrect })
        if (isCorrect) await tx.insert(familiarity).values({ profileId: owner, kanaId: question.kanaId }).onConflictDoNothing()
        return { answer, isCorrect, correctAnswer: question.correctAnswer }
      }))
    },
    complete(owner: string, key: string, id: string) {
      return account(owner, (tx) => receipt(tx, owner, key, "complete:v1", { id }, async () => {
        const session = await findSession(tx, owner, id)
        if (session.status === "active") {
          const answers = await tx.select().from(quizAnswers).where(and(eq(quizAnswers.sessionId, id), eq(quizAnswers.profileId, owner)))
          if (answers.length !== session.total) throw new ApiError(409, "QUIZ_INCOMPLETE", "Answer every question before completing the quiz.")
          await tx.update(quizSessions).set({ status: "completed", score: answers.filter((answer) => answer.isCorrect).length, completedAt: new Date() }).where(and(eq(quizSessions.id, id), eq(quizSessions.profileId, owner)))
        }
        return quizView(tx, owner, id)
      }))
    },
    history(owner: string, limit = 10, cursor?: string) {
      return account(owner, async (tx) => {
        let before
        if (cursor) {
          const last = await findSession(tx, owner, cursor)
          before = or(lt(quizSessions.createdAt, last.createdAt), and(eq(quizSessions.createdAt, last.createdAt), lt(quizSessions.id, cursor)))
        }
        const rows = await tx.select().from(quizSessions).where(and(eq(quizSessions.profileId, owner), before)).orderBy(desc(quizSessions.createdAt), desc(quizSessions.id)).limit(limit + 1)
        return { items: rows.slice(0, limit).map(summary), nextCursor: rows.length > limit ? rows[limit - 1].id : null }
      })
    },
  }
}
export type LearningService = ReturnType<typeof createLearningService>
