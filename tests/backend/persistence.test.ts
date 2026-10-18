import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve, sep } from "node:path"
import { randomUUID } from "node:crypto"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { expect, it } from "vitest"
import * as schema from "../../server/db/schema"
import { seedKana } from "../../scripts/db/seed-kana"
import { createLearningService } from "../../server/services/learning"

it("persists progress, quiz results and idempotency after database close/reopen", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kana-c2-postgres-test-"))
  const absolute = resolve(directory)
  if (!absolute.startsWith(resolve(tmpdir()) + sep) || !absolute.includes("kana-c2-postgres-test-")) throw Error("Refusing unsafe test directory cleanup")
  let pg: PGlite | undefined
  try {
    pg = new PGlite(directory)
    let db = drizzle(pg, { schema })
    await pg.exec("create schema auth; create table auth.users (id uuid primary key)")
    await migrate(db, { migrationsFolder: "./drizzle" })
    await seedKana(db)
    const owner = randomUUID()
    await pg.query("insert into auth.users values ($1)", [owner])
    await pg.exec("set role learning_runtime")
    let service = createLearningService(db)
    const key = randomUUID()
    await service.setFamiliar(owner, key, "h-a", true)
    const started = await service.startQuiz(owner, randomUUID(), { type: "all", questionCount: 5 })
    const dictionary = await service.content()
    for (const question of started.questions) await service.answer(owner, randomUUID(), started.id, question.id, dictionary.find((entry) => entry.id === question.kanaId)!.romaji)
    await service.complete(owner, randomUUID(), started.id)
    await pg.close()
    pg = new PGlite(directory)
    db = drizzle(pg, { schema })
    await pg.exec("set role learning_runtime")
    service = createLearningService(db)
    expect((await service.progress(owner)).learnedIds).toContain("h-a")
    expect((await service.quiz(owner, started.id)).score).toBe(5)
    expect((await service.history(owner)).items).toHaveLength(1)
    await expect(service.setFamiliar(owner, key, "h-i", true)).rejects.toMatchObject({ status: 409 })
  } finally {
    await pg?.close()
    await rm(absolute, { recursive: true, force: true })
  }
}, 60000)
