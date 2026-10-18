import { randomUUID, randomBytes } from "node:crypto"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { afterAll, beforeAll, expect, it } from "vitest"
import * as schema from "../../server/db/schema"
import { seedKana } from "../../scripts/db/seed-kana"
import { createLearningService } from "../../server/services/learning"
import { disposableTestTarget } from "../../scripts/db/targets"

let admin: ReturnType<typeof postgres> | undefined
let runtime: ReturnType<typeof postgres> | undefined
let runtimeRole: string | undefined
let roleCreated = false
let service: ReturnType<typeof createLearningService>
const owner = randomUUID()
const other = randomUUID()

beforeAll(async () => {
  const url = disposableTestTarget(process.env)
  admin = postgres(url.toString(), { max: 1, prepare: false, connect_timeout: 5, onnotice: () => {} })
  const existing = await admin`select 1 from pg_namespace where nspname in ('learning', 'auth')`
  if (existing.length) throw Error("Refusing to alter a nonempty test target. Supply a new disposable database; this suite never resets existing schemas.")
  await admin.unsafe("create schema auth; create table auth.users (id uuid primary key)")
  const db = drizzle(admin, { schema })
  await migrate(db, { migrationsFolder: "./drizzle" })
  await migrate(db, { migrationsFolder: "./drizzle" })
  await seedKana(db); await seedKana(db)
  await admin`insert into auth.users values (${owner}), (${other})`
  runtimeRole = `c2_test_${randomBytes(8).toString("hex")}`
  const password = randomBytes(24).toString("hex")
  try {
    await admin.unsafe(`create role ${runtimeRole} login inherit nosuperuser nobypassrls password '${password}'`)
    roleCreated = true
    await admin.unsafe(`grant learning_runtime to ${runtimeRole}`)
  } catch { throw Error("Unable to create restricted disposable SQL test role; credentials are not logged.") }
  url.username = runtimeRole; url.password = password
  runtime = postgres(url.toString(), { max: 4, prepare: false, connect_timeout: 5 })
  service = createLearningService(drizzle(runtime, { schema }))
})
afterAll(async () => {
  await runtime?.end()
  if (admin) {
    if (roleCreated && runtimeRole) await admin.unsafe(`drop role ${runtimeRole}`)
    await admin.end()
  }
})

it("enforces one concurrent mutation/answer/completion across independent pooled connections", async () => {
  const key = randomUUID()
  const sessions = await Promise.all(Array.from({ length: 8 }, () => service.startQuiz(owner, key, { type: "all", questionCount: 5 })))
  expect(new Set(sessions.map((entry) => entry.id)).size).toBe(1)
  const session = sessions[0]
  const dictionary = await service.content()
  const question = session.questions[0]
  const correct = dictionary.find((entry) => entry.id === question.kanaId)!.romaji
  const wrong = question.options.find((entry) => entry !== correct)!
  const raced = await Promise.allSettled([service.answer(owner, randomUUID(), session.id, question.id, correct), service.answer(owner, randomUUID(), session.id, question.id, wrong)])
  expect(raced.filter((entry) => entry.status === "fulfilled")).toHaveLength(1)
  expect(raced.filter((entry) => entry.status === "rejected")).toHaveLength(1)
  const answerKey = randomUUID()
  const second = session.questions[1]
  const answers = await Promise.all(Array.from({ length: 6 }, () => service.answer(owner, answerKey, session.id, second.id, second.options[0])))
  expect(answers.every((entry) => JSON.stringify(entry) === JSON.stringify(answers[0]))).toBe(true)
  for (const next of session.questions.slice(2)) await service.answer(owner, randomUUID(), session.id, next.id, next.options[0])
  const completed = await Promise.all(Array.from({ length: 6 }, () => service.complete(owner, randomUUID(), session.id)))
  expect(completed.every((entry) => entry.status === "completed" && entry.score === completed[0].score)).toBe(true)
  expect((await service.quiz(owner, session.id)).questions.filter((entry) => entry.feedback)).toHaveLength(5)
  expect((await service.history(owner)).items).toHaveLength(1)
  expect((await service.history(other)).items).toHaveLength(0)
  await expect(service.quiz(other, session.id)).rejects.toMatchObject({ status: 404 })
  const db = drizzle(runtime!, { schema })
  expect(await db.select().from(schema.quizAnswers)).toEqual([])
})
