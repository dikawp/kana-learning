import { createDictionaryService } from "../../server/services/dictionary"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { beforeAll, afterAll, describe, expect, it } from "vitest"
import * as schema from "../../server/db/schema"
import { readKanaContent } from "../../server/services/content"
import { createApi } from "../../server/api/app"
import { assertContentRole, runtimeAccessSql } from "../../server/db/access"
import { ApiError } from "../../server/api/errors"
import { kanaData } from "../../lib/kana-data"
import { seedKana } from "../../scripts/db/seed-kana"

const pg = new PGlite()
const db = drizzle(pg, { schema })
const request = (path: string, method = "GET") => new Request("http://localhost/api/v1" + path, { method })
beforeAll(async () => {
  // Historical migration dependency only; runtime has no managed-user relationship.
  await pg.exec("create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated")
  await migrate(db, { migrationsFolder: "./drizzle" })
  await migrate(db, { migrationsFolder: "./drizzle" })
  await seedKana(db); await seedKana(db)
  await pg.exec("set role learning_runtime")
})
afterAll(async () => { await pg.close() })

describe("published content and restricted SQL", () => {
  it("seeds exactly 208 stable records repeatably and records all forward migrations", async () => {
    expect((await readKanaContent(db)).items).toEqual(kanaData)
    await pg.exec("reset role")
    expect((await pg.query("select * from drizzle.__drizzle_migrations")).rows).toHaveLength(6)
    await pg.exec("set role learning_runtime")
  })
  it("checks actual runtime role including column privileges and denies all learner access", async () => {
    const result = await pg.query<{ rolsuper: boolean; rolbypassrls: boolean; ddl: boolean; unsafe_grants: boolean }>(runtimeAccessSql)
    expect(() => assertContentRole(result.rows)).not.toThrow()
    for (const table of ["profiles", "kana_familiarity", "quiz_sessions", "quiz_questions", "quiz_answers", "mutation_receipts"]) {
      await expect(pg.exec("select * from learning." + table)).rejects.toMatchObject({ code: "42501" })
    }
    await expect(pg.exec("update learning.kana set romaji='wrong'")).rejects.toMatchObject({ code: "42501" })
    await expect(pg.exec("update learning.profiles set id=id")).rejects.toMatchObject({ code: "42501" })
    await expect(pg.exec("update learning.quiz_sessions set score=score")).rejects.toMatchObject({ code: "42501" })
    await expect(pg.exec("select * from auth.users")).rejects.toMatchObject({ code: "42501" })
    await expect(pg.exec("create table learning.forbidden(id int)")).rejects.toThrow()
  })
  it("fails the preflight for privileged or column-granted credentials", async () => {
    await pg.exec("reset role")
    const owner = await pg.query<{ rolsuper: boolean; rolbypassrls: boolean; ddl: boolean; unsafe_grants: boolean }>(runtimeAccessSql)
    expect(() => assertContentRole(owner.rows)).toThrow()
    await pg.exec("grant update(id) on learning.profiles to learning_runtime; set role learning_runtime")
    const unsafe = await pg.query<{ rolsuper: boolean; rolbypassrls: boolean; ddl: boolean; unsafe_grants: boolean }>(runtimeAccessSql)
    expect(() => assertContentRole(unsafe.rows)).toThrow()
    await pg.exec("reset role; revoke update(id) on learning.profiles from learning_runtime; set role learning_runtime")
  })
  it("keeps public data inaccessible through direct anonymous SQL", async () => {
    await pg.exec("reset role; set role anon")
    await expect(pg.exec("select * from learning.kana")).rejects.toMatchObject({ code: "42501" })
    await pg.exec("reset role; set role learning_runtime")
  })
})

describe("anonymous Elysia content contract", () => {
  const api = createApi({ dictionary: async () => createDictionaryService(db), content: () => readKanaContent(db), configured: () => true })
  it("serves ordered content without cookies and revalidates its exact revision", async () => {
    const response = await api.handle(request("/content/kana"))
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.items).toEqual(kanaData)
    expect(payload.revision).toMatch(/^[a-f0-9]{64}$/)
    expect(response.headers.get("set-cookie")).toBeNull()
    expect(response.headers.get("cache-control")).toContain("must-revalidate")
    const unchanged = await api.handle(new Request("http://localhost/api/v1/content/kana", { headers: { "if-none-match": response.headers.get("etag")! } }))
    expect(unchanged.status).toBe(304)
    expect(await unchanged.text()).toBe("")
  })
  it("does not claim configuration is live readiness", async () => {
    expect(await (await api.handle(request("/health"))).json()).toEqual({ contentConfigured: true, liveDependencyCheck: false })
  })
  it("rejects unknown queries and all removed learner routes with safe envelopes", async () => {
    const invalid = await api.handle(request("/content/kana?limit=100000"))
    expect(invalid.status).toBe(422)
    for (const path of ["/auth/session", "/auth/sign-in", "/me/progress", "/quiz-sessions", "/nonexistent"]) {
      for (const method of ["GET", "POST", "PUT"]) {
        const response = await api.handle(request(path, method))
        expect(response.status).toBe(404)
        expect((await response.json()).error.code).toBe("NOT_FOUND")
        expect(response.headers.get("cache-control")).toBe("private, no-store")
      }
    }
  })
  it("never returns SQL details or cached outages", async () => {
    const failing = createApi({ dictionary: async () => createDictionaryService(db), configured: () => false, content: async () => { throw Error("secret SQL details") } })
    const response = await failing.handle(request("/content/kana"))
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain("secret")
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    const absent = createApi({ dictionary: async () => createDictionaryService(db), configured: () => false, content: async () => { throw new ApiError(503, "DATABASE_UNAVAILABLE", "Material storage is not configured.") } })
    expect((await (await absent.handle(request("/content/kana"))).json()).error.code).toBe("DATABASE_UNAVAILABLE")
  })
  it("validates dictionary limits before resolving an unavailable SQL dependency", async () => {
    let connections = 0
    const offline = createApi({ configured: () => false, content: async () => { throw Error("offline") }, dictionary: async () => { connections++; throw Error("offline") } })
    for (const path of ["/content/kanji?level=6", "/content/vocabulary?limit=100", "/content/kanji?level=0", "/content/kanji?level=4.5", "/content/kanji?cursor=bad-cursor"]) {
      expect((await offline.handle(request(path))).status).toBe(422)
    }
    expect(connections).toBe(0)
  })
})
