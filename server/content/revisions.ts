import { createHash } from "node:crypto"
import { asc, eq, inArray } from "drizzle-orm"
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core"
import * as s from "../db/schema"
import { dictionaryDocument, type DictionaryDocument } from "../../lib/content/dictionary"
import { ApiError } from "../api/errors"

export type ContentDatabase = PgDatabase<PgQueryResultHKT, typeof s>
export function canonicalJson(value: unknown): string {
  const sort = (item: unknown): unknown => Array.isArray(item) ? item.map(sort) : item !== null && typeof item === "object" ?
    Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => [k, sort(v)])) : item
  return JSON.stringify(sort(value))
}
export const documentHash = (document: DictionaryDocument) => createHash("sha256").update(canonicalJson(document)).digest("hex")

// Editorial/import credentials only. Never called from a public learning request.
export async function prepareRevision(db: ContentDatabase, materialId: string) {
  return db.transaction(async (tx) => {
    const [material] = await tx.select().from(s.materials).where(eq(s.materials.id, materialId)).for("update")
    if (!material || material.retiredAt) throw new ApiError(409, "MATERIAL_UNAVAILABLE", "Material is missing or retired.")
    const records = await tx.select().from(s.sourceRecords).where(eq(s.sourceRecords.materialId, materialId))
    const levels = await tx.select({ scheme: s.levelAssignments.scheme, level: s.levelAssignments.level, snapshotId: s.levelAssignments.snapshotId, evidenceUrl: s.levelAssignments.evidenceUrl })
      .from(s.levelAssignments).where(eq(s.levelAssignments.materialId, materialId)).orderBy(asc(s.levelAssignments.snapshotId), asc(s.levelAssignments.scheme))
    const snapshotIds = [...new Set([...records.map((r) => r.snapshotId), ...levels.map((l) => l.snapshotId)])].sort()
    if (!snapshotIds.length) throw new ApiError(409, "SOURCE_REQUIRED", "A source snapshot is required.")
    const sources = await tx.select({ snapshotId: s.sourceSnapshots.id, sourceId: s.contentSources.id, version: s.sourceSnapshots.version,
      sourceDate: s.sourceSnapshots.sourceDate, checksum: s.sourceSnapshots.checksum, name: s.contentSources.name, url: s.contentSources.url,
      license: s.contentSources.license, licenseUrl: s.contentSources.licenseUrl, attribution: s.contentSources.attribution })
      .from(s.sourceSnapshots).innerJoin(s.contentSources, eq(s.contentSources.id, s.sourceSnapshots.sourceId)).where(inArray(s.sourceSnapshots.id, snapshotIds)).orderBy(asc(s.sourceSnapshots.id))
    let candidate: unknown
    if (material.kind === "kanji") {
      const [kanji] = await tx.select().from(s.kanji).where(eq(s.kanji.materialId, materialId))
      if (!kanji) throw new ApiError(409, "SUBTYPE_REQUIRED", "Kanji reference data is missing.")
      const meanings = await tx.select().from(s.kanjiMeanings).where(eq(s.kanjiMeanings.materialId, materialId)).orderBy(asc(s.kanjiMeanings.position))
      const readings = await tx.select({ kind: s.kanjiReadings.kind, raw: s.kanjiReadings.raw, kana: s.kanjiReadings.kana }).from(s.kanjiReadings)
        .where(eq(s.kanjiReadings.materialId, materialId)).orderBy(asc(s.kanjiReadings.position))
      candidate = { kind: "kanji", stableKey: material.stableKey, sources, levels, character: kanji.character, strokeCount: kanji.strokeCount,
        grade: kanji.grade, legacyJlpt: kanji.legacyJlpt, readings, meanings: meanings.map((m) => m.meaning) }
    } else {
      const [entry] = await tx.select().from(s.vocabulary).where(eq(s.vocabulary.materialId, materialId))
      if (!entry) throw new ApiError(409, "SUBTYPE_REQUIRED", "Vocabulary reference data is missing.")
      const forms = await tx.select({ id: s.vocabularyForms.id, text: s.vocabularyForms.text }).from(s.vocabularyForms).where(eq(s.vocabularyForms.materialId, materialId)).orderBy(asc(s.vocabularyForms.position))
      const readings = await tx.select().from(s.vocabularyReadings).where(eq(s.vocabularyReadings.materialId, materialId)).orderBy(asc(s.vocabularyReadings.position))
      const senses = await tx.select().from(s.vocabularySenses).where(eq(s.vocabularySenses.materialId, materialId)).orderBy(asc(s.vocabularySenses.position))
      const pairs = await tx.select().from(s.readingForms).where(eq(s.readingForms.materialId, materialId)).orderBy(asc(s.readingForms.formId))
      const sf = await tx.select().from(s.senseForms).where(eq(s.senseForms.materialId, materialId)).orderBy(asc(s.senseForms.formId))
      const sr = await tx.select().from(s.senseReadings).where(eq(s.senseReadings.materialId, materialId)).orderBy(asc(s.senseReadings.readingId))
      candidate = { kind: "vocabulary", stableKey: material.stableKey, sources, levels, forms,
        readings: readings.map((r) => ({ id: r.id, kana: r.kana, formScope: r.formScope, formIds: pairs.filter((p) => p.readingId === r.id).map((p) => p.formId) })),
        senses: senses.map((sense) => ({ id: sense.id, english: sense.english, partsOfSpeech: sense.partsOfSpeech, formScope: sense.formScope,
          formIds: sf.filter((p) => p.senseId === sense.id).map((p) => p.formId), readingScope: sense.readingScope, readingIds: sr.filter((p) => p.senseId === sense.id).map((p) => p.readingId) })) }
    }
    const parsed = dictionaryDocument.safeParse(candidate)
    if (!parsed.success) throw new ApiError(409, "INVALID_REFERENCE", "Reference data or relationships are incomplete.")
    const payload = parsed.data, checksum = documentHash(payload)
    const [revision] = await tx.insert(s.materialRevisions).values({ materialId, checksum, payload }).onConflictDoNothing().returning()
    if (!revision) {
      const existing = await tx.select().from(s.materialRevisions).where(eq(s.materialRevisions.materialId, materialId))
      const found = existing.find((r) => r.checksum === checksum)
      if (!found) throw new ApiError(409, "REVISION_CONFLICT", "Reference revision could not be resolved.")
      return found
    }
    await tx.insert(s.revisionSources).values(snapshotIds.map((snapshotId) => ({ revisionId: revision.id, snapshotId })))
    return revision
  })
}
