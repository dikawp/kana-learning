import { randomUUID } from "node:crypto"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { eq } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import * as s from "../../server/db/schema"
import { prepareRevision, documentHash } from "../../server/content/revisions"
import { publishRelease } from "../../server/content/publication"
import { createDictionaryService } from "../../server/services/dictionary"
import { dictionaryDocument } from "../../lib/content/dictionary"
import { createApi } from "../../server/api/app"
import { readKanaContent } from "../../server/services/content"
import { seedKana } from "../../scripts/db/seed-kana"

// Entirely synthetic original fixtures. These reviews/rights are NOT production content approval.
const pg = new PGlite()
const db = drizzle(pg, { schema: s })
const dictionary = createDictionaryService(db)
let snapshotId: string
beforeAll(async () => {
  await pg.exec("create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated")
  await migrate(db, { migrationsFolder: "./drizzle" }); await migrate(db, { migrationsFolder: "./drizzle" })
  await seedKana(db)
})
beforeEach(async () => {
  await pg.exec("reset role; truncate learning.materials, learning.content_sources, learning.content_releases cascade")
  await db.insert(s.contentSources).values({ id: "fixture-source", name: "Synthetic dictionary fixture", url: "https://fixture.example.test/dictionary", license: "CC0-1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", attribution: "Original synthetic test data; not a teaching corpus", reuseStatus: "pending" })
  const [snapshot] = await db.insert(s.sourceSnapshots).values({ sourceId: "fixture-source", version: "fixture-v1", schemaVersion: "fixture-1", checksum: "a".repeat(64), sourceDate: "2026-10-22", transportUrl: "https://fixture.example.test/dictionary-v1.json" }).returning()
  snapshotId = snapshot.id
})
afterAll(async () => { await pg.close() })

async function allowFixtureRights() {
  await db.update(s.contentSources).set({ reuseStatus: "verified", rightsEvidence: "Synthetic original fixture permission for automated tests only" })
}
async function material(kind: "kanji" | "vocabulary", stableKey: string) {
  const [entry] = await db.insert(s.materials).values({ kind, stableKey }).returning()
  await db.insert(s.sourceRecords).values({ sourceId: "fixture-source", externalId: stableKey, snapshotId, materialId: entry.id, rawHash: "b".repeat(64) })
  return entry
}
async function kanji(character = "日", key = "kanji:65e5") {
  const entry = await material("kanji", key)
  await db.insert(s.kanji).values({ materialId: entry.id, character, strokeCount: null, legacyJlpt: 4 })
  await db.insert(s.kanjiMeanings).values({ materialId: entry.id, meaning: character === "日" ? "sun" : "moon", position: 0 })
  await db.insert(s.kanjiReadings).values([{ materialId: entry.id, kind: "on", raw: "ニチ", kana: "ニチ", position: 0 }, { materialId: entry.id, kind: "kun", raw: "-び", kana: "び", position: 1 }])
  return entry
}
async function vocabulary(kanaOnly = false, key = "jmdict:fixture-1") {
  const entry = await material("vocabulary", key)
  await db.insert(s.vocabulary).values({ materialId: entry.id })
  const forms = kanaOnly ? [] : await db.insert(s.vocabularyForms).values([
    { materialId: entry.id, text: "取り扱い", position: 0 }, { materialId: entry.id, text: "取扱い", position: 1 },
  ]).returning()
  const [reading] = await db.insert(s.vocabularyReadings).values({ materialId: entry.id, kana: kanaOnly ? "ありがとう" : "とりあつかい", formScope: kanaOnly ? "kana-only" : "restricted", position: 0 }).returning()
  if (forms[0]) await db.insert(s.readingForms).values({ materialId: entry.id, readingId: reading.id, formId: forms[0].id })
  const [sense] = await db.insert(s.vocabularySenses).values({ materialId: entry.id, english: [kanaOnly ? "thank you" : "handling"], partsOfSpeech: [kanaOnly ? "expression" : "noun"], formScope: kanaOnly ? "all" : "restricted", readingScope: "restricted", position: 0 }).returning()
  if (forms[0]) await db.insert(s.senseForms).values({ materialId: entry.id, senseId: sense.id, formId: forms[0].id })
  await db.insert(s.senseReadings).values({ materialId: entry.id, senseId: sense.id, readingId: reading.id })
  return { entry, forms, reading, sense }
}
async function reviewed(materialId: string) {
  const revision = await prepareRevision(db, materialId)
  await db.insert(s.contentReviews).values({ revisionId: revision.id, reviewer: "synthetic-test-reviewer", notes: "Fixture validation only; no real editorial approval" })
  return revision
}
async function release(materialId: string, revisionId: string, slug = randomUUID()) {
  const [result] = await db.insert(s.contentReleases).values({ slug }).returning()
  await db.insert(s.releaseItems).values({ releaseId: result.id, materialId, revisionId })
  return result
}
const runtime = () => pg.exec("set role learning_runtime")

describe("relational dictionary integrity", () => {
  it("keeps source/checksum identities unique and binds source records to their actual snapshot source", async () => {
    await expect(db.insert(s.sourceSnapshots).values({ sourceId: "fixture-source", version: "v2", schemaVersion: "fixture", checksum: "a".repeat(64), sourceDate: "2026-10-22", transportUrl: "https://fixture.example.test/v2" })).rejects.toThrow()
    const m = await kanji()
    await db.insert(s.contentSources).values({ id: "other-source", name: "Other fixture", url: "https://other.example.test", license: "CC0", licenseUrl: "https://other.example.test/license", attribution: "Fixture" })
    await expect(db.insert(s.sourceRecords).values({ materialId: m.id, snapshotId, sourceId: "other-source", externalId: "x", rawHash: "a".repeat(64) })).rejects.toThrow()
  })
  it("rejects wrong material subtypes and cross-entry reading/sense/form relationships", async () => {
    const m = await material("vocabulary", "vocab:wrong-kind")
    await expect(db.insert(s.kanji).values({ materialId: m.id, character: "月" })).rejects.toThrow()
    const a = await vocabulary(), b = await vocabulary(false, "jmdict:fixture-2")
    await expect(db.insert(s.readingForms).values({ materialId: a.entry.id, readingId: a.reading.id, formId: b.forms[0].id })).rejects.toThrow()
    await expect(db.insert(s.senseForms).values({ materialId: a.entry.id, senseId: a.sense.id, formId: b.forms[0].id })).rejects.toThrow()
    await expect(db.insert(s.senseReadings).values({ materialId: a.entry.id, senseId: a.sense.id, readingId: b.reading.id })).rejects.toThrow()
  })
  it("preserves kana-only entries, multiple readings and restricted pairs without invented combinations", async () => {
    const only = await vocabulary(true), word = await vocabulary(false, "jmdict:fixture-2")
    const onlyPayload = dictionaryDocument.parse((await prepareRevision(db, only.entry.id)).payload)
    expect(onlyPayload.kind).toBe("vocabulary")
    if (onlyPayload.kind === "vocabulary") { expect(onlyPayload.forms).toEqual([]); expect(onlyPayload.readings[0].formScope).toBe("kana-only") }
    const payload = dictionaryDocument.parse((await prepareRevision(db, word.entry.id)).payload)
    if (payload.kind !== "vocabulary") throw Error("Unexpected fixture kind")
    expect(payload.readings[0].formIds).toEqual([word.forms[0].id])
    expect(payload.senses[0].formIds).not.toContain(word.forms[1].id)
    const k = await kanji()
    const kp = dictionaryDocument.parse((await prepareRevision(db, k.id)).payload)
    if (kp.kind !== "kanji") throw Error("Unexpected fixture kind")
    expect(kp.strokeCount).toBeNull(); expect(kp.readings).toHaveLength(2); expect(kp.readings[1].raw).toBe("-び")
  })
  it("rejects incomplete reference data and incompatible sense applicability before revision creation", async () => {
    const m = await material("kanji", "kanji:incomplete")
    await expect(prepareRevision(db, m.id)).rejects.toMatchObject({ code: "SUBTYPE_REQUIRED" })
    const word = await vocabulary()
    await db.delete(s.senseForms).where(eq(s.senseForms.senseId, word.sense.id))
    await db.insert(s.senseForms).values({ materialId: word.entry.id, senseId: word.sense.id, formId: word.forms[1].id })
    await expect(prepareRevision(db, word.entry.id)).rejects.toMatchObject({ code: "INVALID_REFERENCE" })
  })
  it("creates idempotent immutable revisions and preserves identity across editorial changes", async () => {
    const m = await kanji(), first = await prepareRevision(db, m.id)
    expect((await prepareRevision(db, m.id)).id).toBe(first.id)
    await db.update(s.kanjiMeanings).set({ meaning: "day" }).where(eq(s.kanjiMeanings.materialId, m.id))
    const second = await prepareRevision(db, m.id)
    expect(second.id).not.toBe(first.id); expect(second.materialId).toBe(first.materialId)
    await expect(db.update(s.materialRevisions).set({ payload: {} }).where(eq(s.materialRevisions.id, first.id))).rejects.toThrow()
    await expect(db.update(s.sourceSnapshots).set({ version: "rewritten" })).rejects.toThrow()
    await expect(db.update(s.materials).set({ stableKey: "changed" }).where(eq(s.materials.id, m.id))).rejects.toThrow()
  })
})

describe("fail-closed publication and public read view", () => {
  it("hides all draft content and denies private base-table access to runtime", async () => {
    const m = await kanji(), rev = await prepareRevision(db, m.id), r = await release(m.id, rev.id)
    await expect(db.insert(s.activeRelease).values({ releaseId: r.id })).rejects.toThrow()
    await runtime()
    expect((await dictionary.list("kanji", {})).items).toEqual([])
    for (const table of ["materials", "source_snapshots", "material_revisions", "content_reviews", "content_sources"]) {
      await expect(pg.exec("select * from learning." + table)).rejects.toMatchObject({ code: "42501" })
    }
    await expect(dictionary.detail("kanji", m.stableKey)).rejects.toMatchObject({ status: 404 })
  })
  it("requires recorded editorial review, verified reuse evidence and real publisher identity", async () => {
    const m = await kanji(), rev = await prepareRevision(db, m.id), r = await release(m.id, rev.id)
    await expect(publishRelease(db, r.id, " ")).rejects.toMatchObject({ code: "PUBLISHER_REQUIRED" })
    await expect(publishRelease(db, r.id, "fixture-operator")).rejects.toMatchObject({ code: "REVIEW_REQUIRED" })
    await db.insert(s.contentReviews).values({ revisionId: rev.id, reviewer: "fixture-reviewer", notes: "Test only" })
    await expect(publishRelease(db, r.id, "fixture-operator")).rejects.toMatchObject({ code: "RIGHTS_REQUIRED" })
    expect(await db.select().from(s.activeRelease)).toEqual([])
    await allowFixtureRights()
    expect(await publishRelease(db, r.id, "fixture-operator")).toEqual({ releaseId: r.id, count: 1 })
    expect(await publishRelease(db, r.id, "fixture-operator")).toEqual({ releaseId: r.id, count: 1 })
    await runtime()
    expect((await dictionary.detail("kanji", m.stableKey)).stableKey).toBe(m.stableKey)
    await expect(pg.exec("update learning.active_release set release_id=release_id")).rejects.toMatchObject({ code: "42501" })
  })
  it("preserves the active release when a new release is invalid, and keeps published snapshots immutable", async () => {
    await allowFixtureRights()
    const m = await kanji(), rev = await reviewed(m.id), r = await release(m.id, rev.id)
    await publishRelease(db, r.id, "fixture-operator")
    const next = await kanji("月", "kanji:6708"), nextRev = await prepareRevision(db, next.id), bad = await release(next.id, nextRev.id)
    await expect(publishRelease(db, bad.id, "fixture-operator")).rejects.toMatchObject({ code: "REVIEW_REQUIRED" })
    expect((await db.select().from(s.activeRelease))[0].releaseId).toBe(r.id)
    await expect(db.delete(s.releaseItems).where(eq(s.releaseItems.releaseId, r.id))).rejects.toThrow()
    await expect(db.delete(s.contentReviews).where(eq(s.contentReviews.revisionId, rev.id))).rejects.toThrow()
    await expect(db.update(s.contentReleases).set({ publisher: "changed" }).where(eq(s.contentReleases.id, r.id))).rejects.toThrow()
    await db.update(s.kanjiMeanings).set({ meaning: "unpublished correction" }).where(eq(s.kanjiMeanings.materialId, m.id))
    await runtime()
    const active = await dictionary.detail("kanji", m.stableKey)
    if (active.kind !== "kanji") throw Error("Unexpected fixture kind")
    expect(active.meanings).toEqual(["sun"])
  })
  it("rejects cross-material release items, empty releases and forged payload checksums", async () => {
    const a = await kanji(), b = await kanji("月", "kanji:6708"), rev = await reviewed(a.id)
    const [empty] = await db.insert(s.contentReleases).values({ slug: "empty" }).returning()
    await expect(publishRelease(db, empty.id, "fixture-operator")).rejects.toMatchObject({ code: "EMPTY_RELEASE" })
    await expect(db.insert(s.releaseItems).values({ releaseId: empty.id, materialId: b.id, revisionId: rev.id })).rejects.toThrow()
    const payload = dictionaryDocument.parse(rev.payload)
    expect(documentHash(payload)).toBe(rev.checksum)
    const [forged] = await db.insert(s.materialRevisions).values({ materialId: b.id, checksum: "f".repeat(64), payload }).returning()
    const r = await release(b.id, forged.id)
    await expect(publishRelease(db, r.id, "fixture-operator")).rejects.toMatchObject({ code: "INVALID_REVISION" })
  })
})

it("supports bounded public pagination/search/detail and distinguishes modern and legacy JLPT evidence", async () => {
  await allowFixtureRights()
  const a = await kanji(), b = await kanji("月", "kanji:6708"), word = await vocabulary()
  await db.insert(s.levelAssignments).values([{ materialId: a.id, snapshotId, scheme: "jlpt-current-approx", level: 5, evidenceUrl: "https://fixture.example.test/current-n5" }, { materialId: b.id, snapshotId, scheme: "jlpt-pre2010", level: 4, evidenceUrl: "https://fixture.example.test/legacy-4" }])
  await expect(db.insert(s.levelAssignments).values({ materialId: word.entry.id, snapshotId, scheme: "jlpt-pre2010", level: 5, evidenceUrl: "https://fixture.example.test/invalid" })).rejects.toThrow()
  await db.insert(s.vocabularyKanji).values({ formId: word.forms[0].id, kanjiId: a.id, position: 0 })
  const [r] = await db.insert(s.contentReleases).values({ slug: "public-fixture" }).returning()
  for (const m of [a, b, word.entry]) { const rev = await reviewed(m.id); await db.insert(s.releaseItems).values({ releaseId: r.id, materialId: m.id, revisionId: rev.id }) }
  await publishRelease(db, r.id, "fixture-operator"); await runtime()
  const first = await dictionary.list("kanji", { limit: 1 })
  const second = await dictionary.list("kanji", { limit: 1, cursor: first.nextCursor! })
  expect(first.items).toHaveLength(1); expect(second.items).toHaveLength(1); expect(first.items[0].id).not.toBe(second.items[0].id)
  expect(second.nextCursor).toBeNull()
  await expect(dictionary.list("kanji", { cursor: first.nextCursor!, q: "changed-query" })).rejects.toMatchObject({ code: "INVALID_CURSOR" })
  await expect(dictionary.list("kanji", { cursor: "not-valid-json" })).rejects.toMatchObject({ code: "INVALID_CURSOR" })
  expect((await dictionary.list("kanji", { level: 5 })).items.map((i) => i.stableKey)).toEqual([a.stableKey])
  expect((await dictionary.list("vocabulary", { level: 5 })).items).toEqual([])
  expect((await dictionary.list("kanji", { q: "日" })).items).toHaveLength(1)
  expect((await dictionary.list("kanji", { q: "%" })).items).toEqual([])
  expect((await dictionary.list("kanji", { q: "fixture.example.test" })).items).toEqual([])
  const api = createApi({ configured: () => true, content: () => readKanaContent(db), dictionary: async () => dictionary })
  const request = (path: string) => new Request("http://localhost/api/v1/content/" + path)
  expect((await api.handle(request("kanji?limit=1&level=5"))).status).toBe(200)
  for (const invalid of ["kanji?limit=999", "vocabulary?level=0", "kanji?level=4.5", "kanji?unknown=x", "kanji?q=" + "x".repeat(101)]) expect((await api.handle(request(invalid))).status).toBe(422)
  const detail = await api.handle(request("kanji/" + encodeURIComponent(a.stableKey)))
  expect(detail.status).toBe(200); expect(detail.headers.get("set-cookie")).toBeNull()
  expect((await api.handle(request("vocabulary/" + encodeURIComponent(a.stableKey)))).status).toBe(404)
  await pg.exec("reset role")
  const [replacement] = await db.insert(s.contentReleases).values({ slug: "replacement" }).returning()
  const oldItems = await db.select().from(s.releaseItems).where(eq(s.releaseItems.releaseId, r.id))
  await db.insert(s.releaseItems).values(oldItems.map((item) => ({ ...item, releaseId: replacement.id })))
  await publishRelease(db, replacement.id, "fixture-operator")
  await runtime()
  await expect(dictionary.list("kanji", { cursor: first.nextCursor! })).rejects.toMatchObject({ code: "CONTENT_CHANGED" })
})
