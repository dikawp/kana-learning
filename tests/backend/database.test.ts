import { randomUUID } from "node:crypto"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { eq, sql } from "drizzle-orm"
import * as schema from "../../server/db/schema"
import { seedKana } from "../../scripts/db/seed-kana"
import { createLearningService } from "../../server/services/learning"
import { createApi } from "../../server/api/app"
import type { AuthGateway } from "../../server/auth/gateway"

const owner = randomUUID()
const other = randomUUID()
const pg = new PGlite()
const db = drizzle(pg, { schema })
const service = createLearningService(db)
const auth = (id: string | null): AuthGateway => ({
  user: async () => id ? { id, email: "learner@example.test" } : null,
  signIn: async () => {}, signUp: async () => {}, recover: async () => {}, updatePassword: async () => {}, signOut: async () => {},
})
function api(id: string | null = owner) {
  return createApi({ auth: async () => auth(id), learning: async () => service, origin: () => "http://localhost:3000", authConfigured: () => true })
}
function request(path: string, method = "GET", body?: unknown, origin: string | null = "http://localhost:3000") {
  return new Request(`http://localhost:3000/api/v1${path}`, { method, headers: { ...(origin ? { origin } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) })
}

beforeAll(async () => {
  // auth.users is a test-only identity fixture. Production uses Supabase's managed table.
  await pg.exec("create schema auth; create table auth.users (id uuid primary key); create role anon; create role authenticated;")
  await migrate(db, { migrationsFolder: "./drizzle" })
  await migrate(db, { migrationsFolder: "./drizzle" })
  await seedKana(db)
  await seedKana(db)
  await pg.query("insert into auth.users (id) values ($1), ($2)", [owner, other])
})
beforeEach(async () => {
  await pg.exec("reset role; truncate learning.profiles cascade; set role learning_runtime;")
})
afterAll(async () => { await pg.close() })

describe("PostgreSQL migrations, constraints and restricted SQL role", () => {
  it("seeds 208 records repeatably, has durable migration receipts, and denies unscoped/private access", async () => {
    expect(await service.content()).toHaveLength(208)
    expect((await db.select().from(schema.profiles))).toEqual([])
    await expect(db.insert(schema.profiles).values({ id: owner })).rejects.toThrow()
    await expect(db.update(schema.kana).set({ romaji: "changed" })).rejects.toThrow()
    await pg.exec("reset role")
    expect((await pg.query("select * from drizzle.__drizzle_migrations")).rows).toHaveLength(3)
    await pg.exec("set role anon")
    await expect(pg.query("select * from learning.kana")).rejects.toThrow()
    await pg.exec("reset role; set role learning_runtime")
  })

  it("persists familiarity across service instances, rejects unknown kana, and isolates accounts in SQL and API", async () => {
    const key = randomUUID()
    await service.setFamiliar(owner, key, "h-a", true)
    expect(await createLearningService(db).progress(owner)).toEqual({ learnedIds: ["h-a"] })
    expect(await service.progress(other)).toEqual({ learnedIds: [] })
    await expect(service.setFamiliar(owner, randomUUID(), "unknown", true)).rejects.toMatchObject({ status: 422 })
    await db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.profile_id', ${other}, true)`)
      expect(await tx.select().from(schema.familiarity)).toEqual([])
      expect(await tx.update(schema.profiles).set({ id: owner }).where(eq(schema.profiles.id, owner)).returning()).toEqual([])
    })
    await expect(db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.profile_id', ${other}, true)`)
      await tx.insert(schema.familiarity).values({ profileId: owner, kanaId: "h-i" })
    })).rejects.toThrow()
    expect(await service.progress(owner)).toEqual({ learnedIds: ["h-a"] })
    const response = await api(other).handle(request("/me/progress"))
    expect(await response.json()).toEqual({ learnedIds: [] })
  })

  it("enforces FK, unique, score and cross-owner question constraints", async () => {
    await service.progress(owner)
    await service.progress(other)
    await pg.exec("reset role")
    await expect(pg.query("insert into learning.kana_familiarity values ($1, 'absent', now())", [owner])).rejects.toThrow()
    await expect(pg.query("insert into learning.quiz_sessions (profile_id, config, total) values ($1, '{}', 0)", [owner])).rejects.toThrow()
    const session = await db.insert(schema.quizSessions).values({ profileId: owner, config: { type: "all", questionCount: 5 }, total: 5 }).returning()
    await expect(db.insert(schema.quizQuestions).values({ sessionId: session[0].id, profileId: other, kanaId: "h-a", position: 0, snapshot: (await service.content())[0], options: ["a"], correctAnswer: "a" })).rejects.toThrow()
    await expect(db.update(schema.quizSessions).set({ status: "completed", score: 6, completedAt: new Date() }).where(eq(schema.quizSessions.id, session[0].id))).rejects.toThrow()
    await expect(db.update(schema.quizSessions).set({ status: "completed", score: null, completedAt: new Date() }).where(eq(schema.quizSessions.id, session[0].id))).rejects.toThrow()
  })
})

describe("idempotent server grading and history", () => {
  it("serializes repeated/concurrent requests, preserves one answer, and never trusts a client score", async () => {
    const key = randomUUID()
    const [first, retry] = await Promise.all([service.startQuiz(owner, key, { type: "hiragana", questionCount: 5 }), service.startQuiz(owner, key, { type: "hiragana", questionCount: 5 })])
    expect(retry).toEqual(first)
    expect(JSON.stringify(first)).not.toContain("correctAnswer")
    expect(first.questions.every((q) => q.feedback === null && !("romaji" in q))).toBe(true)
    await expect(service.startQuiz(owner, key, { type: "katakana", questionCount: 5 })).rejects.toMatchObject({ status: 409 })
    await expect(service.complete(owner, randomUUID(), first.id)).rejects.toMatchObject({ status: 409 })
    const dictionary = await service.content()
    const question = first.questions[0]
    const answer = dictionary.find((entry) => entry.id === question.kanaId)!.romaji
    const answerKey = randomUUID()
    const feedback = await Promise.all([service.answer(owner, answerKey, first.id, question.id, answer), service.answer(owner, answerKey, first.id, question.id, answer)])
    expect(feedback[0]).toEqual(feedback[1])
    expect(feedback[0].isCorrect).toBe(true)
    await expect(service.answer(owner, answerKey, first.id, question.id, "different")).rejects.toMatchObject({ status: 409 })
    const conflict = question.options.find((option) => option !== answer)!
    const outcomes = await Promise.allSettled([service.answer(owner, randomUUID(), first.id, question.id, answer), service.answer(owner, randomUUID(), first.id, question.id, conflict)])
    expect(outcomes[0].status).toBe("fulfilled")
    expect(outcomes[1].status).toBe("rejected")
    for (const q of first.questions.slice(1)) await service.answer(owner, randomUUID(), first.id, q.id, q.options.find((option) => option !== dictionary.find((entry) => entry.id === q.kanaId)!.romaji)!)
    const [completed, completedAgain] = await Promise.all([service.complete(owner, randomUUID(), first.id), service.complete(owner, randomUUID(), first.id)])
    expect(completedAgain).toEqual(completed)
    expect(completed.score).toBe(1)
    expect(completed.status).toBe("completed")
    expect(completed.questions).toHaveLength(5)
    expect(completed.questions[0].feedback?.correctAnswer).toBe(answer)
    expect((await createLearningService(db).quiz(owner, first.id))).toEqual(completed)
    expect((await service.history(owner)).items).toHaveLength(1)
    expect((await service.history(other)).items).toHaveLength(0)
    await expect(service.quiz(other, first.id)).rejects.toMatchObject({ status: 404 })
    await expect(service.answer(other, randomUUID(), first.id, question.id, answer)).rejects.toMatchObject({ status: 404 })
    await expect(service.complete(other, randomUUID(), first.id)).rejects.toMatchObject({ status: 404 })
  })

  it("returns ordered paginated history and idempotent/reset-isolated progress", async () => {
    for (let i = 0; i < 3; i++) await service.startQuiz(owner, randomUUID(), { type: "all", questionCount: 5 })
    const first = await service.history(owner, 2)
    const second = await service.history(owner, 2, first.nextCursor!)
    expect(first.items).toHaveLength(2)
    expect(second.items).toHaveLength(1)
    expect(new Set([...first.items, ...second.items].map((entry) => entry.id)).size).toBe(3)
    const foreign = await service.startQuiz(other, randomUUID(), { type: "all", questionCount: 5 })
    await expect(service.history(owner, 2, foreign.id)).rejects.toMatchObject({ status: 404 })
    const key = randomUUID()
    await service.setFamiliar(owner, key, "h-a", true)
    await service.setFamiliar(owner, key, "h-a", true)
    await expect(service.setFamiliar(owner, key, "h-a", false)).rejects.toMatchObject({ status: 409 })
    await service.setFamiliar(owner, randomUUID(), "k-a", true)
    await service.setFamiliar(other, randomUUID(), "h-a", true)
    await service.reset(owner, randomUUID(), "hiragana")
    expect(await service.progress(owner)).toEqual({ learnedIds: ["k-a"] })
    expect(await service.progress(other)).toEqual({ learnedIds: ["h-a"] })
    await service.reset(owner, randomUUID(), "all")
    expect(await service.progress(owner)).toEqual({ learnedIds: [] })
  })
})

describe("real Elysia Request/Response authentication and validation boundary", () => {
  it("rejects unauthenticated/forged owner writes, CSRF, invalid payloads and oversized JSON", async () => {
    expect((await api(null).handle(request("/me/progress"))).status).toBe(401)
    for (const origin of [null, "https://attacker.test"]) {
      expect((await api().handle(request("/me/progress", "PUT", { requestId: randomUUID(), kanaId: "h-a", familiar: true }, origin))).status).toBe(403)
    }
    const spoof = await api().handle(request("/me/progress", "PUT", { requestId: randomUUID(), kanaId: "h-a", familiar: true, userId: other }))
    expect(spoof.status).toBe(422)
    expect((await api().handle(request("/quiz-sessions", "POST", { requestId: randomUUID(), type: "all", questionCount: 0, score: 100 }))).status).toBe(422)
    const oversized = await api().handle(request("/auth/sign-in", "POST", { email: "a@example.test", password: "a".repeat(17000) }))
    expect(oversized.status).toBe(413)
    const invalid = await api().handle(new Request("http://localhost:3000/api/v1/auth/sign-in", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: "{" }))
    expect(invalid.status).toBe(400)
    const error = await invalid.json()
    expect(error.error.requestId).toEqual(expect.any(String))
    expect(JSON.stringify(error)).not.toMatch(/stack|password|postgres/i)
  })

  it("executes the actual API persistence/quiz flow and hides foreign sessions", async () => {
    const app = api()
    const started = await app.handle(request("/quiz-sessions", "POST", { requestId: randomUUID(), type: "all", questionCount: 5 }))
    expect(started.status).toBe(200)
    const session = await started.json()
    expect((await api(other).handle(request(`/quiz-sessions/${session.id}`))).status).toBe(404)
    const answered = await app.handle(request(`/quiz-sessions/${session.id}/answers`, "POST", { requestId: randomUUID(), questionId: session.questions[0].id, answer: session.questions[0].options[0] }))
    expect(answered.status).toBe(200)
    expect((await answered.json()).correctAnswer).toEqual(expect.any(String))
    const history = await app.handle(request("/quiz-sessions?limit=1"))
    expect(history.status).toBe(200)
    expect((await history.json()).items).toHaveLength(1)
    expect(history.headers.get("cache-control")).toBe("private, no-store")
    expect((await app.handle(request("/quiz-sessions?limit=100"))).status).toBe(422)
    expect((await app.handle(request("/quiz-sessions/not-uuid"))).status).toBe(422)
  })
})
