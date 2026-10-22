import { sql } from "drizzle-orm"
import { pgSchema, text, uuid, integer, timestamp, jsonb, primaryKey, unique, foreignKey, check, index } from "drizzle-orm/pg-core"

const learning = pgSchema("learning")
const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
const ordinal = () => integer("position").notNull()

export const contentSources = learning.table("content_sources", {
  id: text("id").primaryKey(), name: text("name").notNull(), url: text("url").notNull(),
  license: text("license").notNull(), licenseUrl: text("license_url").notNull(), attribution: text("attribution").notNull(),
  reuseStatus: text("reuse_status").$type<"pending" | "verified">().notNull().default("pending"),
  rightsEvidence: text("rights_evidence"), createdAt: created(),
}, (t) => [check("source_reuse_status", sql`${t.reuseStatus} in ('pending','verified')`), check("source_rights_evidence", sql`${t.reuseStatus} <> 'verified' or length(${t.rightsEvidence}) > 0 and ${t.rightsEvidence} is not null`), check("source_urls", sql`${t.url} like 'https://%' and ${t.licenseUrl} like 'https://%'`)])

export const sourceSnapshots = learning.table("source_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(), sourceId: text("source_id").notNull().references(() => contentSources.id),
  version: text("version").notNull(), schemaVersion: text("schema_version").notNull(), checksum: text("checksum").notNull(),
  sourceDate: text("source_date").notNull(), transportUrl: text("transport_url").notNull(), fetchedAt: created(),
}, (t) => [unique("snapshot_source_checksum").on(t.sourceId, t.checksum), unique("snapshot_source_identity").on(t.id, t.sourceId), check("snapshot_checksum", sql`${t.checksum} ~ '^[a-f0-9]{64}$'`)])

export const importRuns = learning.table("import_runs", {
  id: uuid("id").primaryKey().defaultRandom(), snapshotId: uuid("snapshot_id").notNull().references(() => sourceSnapshots.id),
  adapterVersion: text("adapter_version").notNull(), status: text("status").$type<"running" | "completed" | "failed">().notNull(),
  cursor: integer("cursor").notNull().default(0), processed: integer("processed").notNull().default(0), rejected: integer("rejected").notNull().default(0),
  errorCode: text("error_code"), startedAt: created(), finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (t) => [index("import_snapshot_status").on(t.snapshotId, t.status), check("import_status", sql`${t.status} in ('running','completed','failed')`), check("import_counts", sql`${t.cursor} >= 0 and ${t.processed} >= 0 and ${t.rejected} >= 0`), check("import_finished", sql`(${t.status}='running' and ${t.finishedAt} is null) or (${t.status}<>'running' and ${t.finishedAt} is not null)`)])

export const materials = learning.table("materials", {
  id: uuid("id").primaryKey().defaultRandom(), stableKey: text("stable_key").notNull().unique(),
  kind: text("kind").$type<"kanji" | "vocabulary">().notNull(), createdAt: created(), retiredAt: timestamp("retired_at", { withTimezone: true }),
}, (t) => [unique("material_kind_identity").on(t.id, t.kind), index("material_kind_key").on(t.kind, t.stableKey), check("material_kind", sql`${t.kind} in ('kanji','vocabulary')`), check("material_key", sql`length(${t.stableKey}) between 1 and 120`)])

export const sourceRecords = learning.table("source_records", {
  sourceId: text("source_id").notNull(), externalId: text("external_id").notNull(), snapshotId: uuid("snapshot_id").notNull(),
  materialId: uuid("material_id").notNull().references(() => materials.id), rawHash: text("raw_hash").notNull(),
}, (t) => [primaryKey({ columns: [t.sourceId, t.externalId] }), foreignKey({ columns: [t.snapshotId, t.sourceId], foreignColumns: [sourceSnapshots.id, sourceSnapshots.sourceId] }), index("record_material").on(t.materialId), check("record_hash", sql`${t.rawHash} ~ '^[a-f0-9]{64}$'`)])

export const kanji = learning.table("kanji", {
  materialId: uuid("material_id").primaryKey(), kind: text("kind").notNull().default("kanji"), character: text("character").notNull().unique(),
  strokeCount: integer("stroke_count"), grade: integer("grade"), legacyJlpt: integer("legacy_jlpt"),
}, (t) => [foreignKey({ columns: [t.materialId, t.kind], foreignColumns: [materials.id, materials.kind] }), check("kanji_kind", sql`${t.kind}='kanji'`), check("kanji_character", sql`char_length(${t.character})=1`), check("kanji_strokes", sql`${t.strokeCount} is null or ${t.strokeCount} between 1 and 100`), check("kanji_legacy_level", sql`${t.legacyJlpt} is null or ${t.legacyJlpt} between 1 and 4`)])

export const kanjiReadings = learning.table("kanji_readings", {
  id: uuid("id").primaryKey().defaultRandom(), materialId: uuid("material_id").notNull().references(() => kanji.materialId),
  kind: text("kind").$type<"on" | "kun" | "nanori">().notNull(), raw: text("raw").notNull(), kana: text("kana").notNull(), position: ordinal(),
}, (t) => [unique("kanji_reading_position").on(t.materialId, t.position), check("kanji_reading_kind", sql`${t.kind} in ('on','kun','nanori')`), check("kanji_reading_text", sql`length(${t.raw})>0 and length(${t.kana})>0 and ${t.position}>=0`)])

export const kanjiMeanings = learning.table("kanji_meanings", {
  id: uuid("id").primaryKey().defaultRandom(), materialId: uuid("material_id").notNull().references(() => kanji.materialId),
  meaning: text("meaning").notNull(), position: ordinal(),
}, (t) => [unique("kanji_meaning_position").on(t.materialId, t.position), check("kanji_meaning_text", sql`length(${t.meaning})>0 and ${t.position}>=0`)])

export const vocabulary = learning.table("vocabulary", {
  materialId: uuid("material_id").primaryKey(), kind: text("kind").notNull().default("vocabulary"),
}, (t) => [foreignKey({ columns: [t.materialId, t.kind], foreignColumns: [materials.id, materials.kind] }), check("vocabulary_kind", sql`${t.kind}='vocabulary'`)])

export const vocabularyForms = learning.table("vocabulary_forms", {
  id: uuid("id").primaryKey().defaultRandom(), materialId: uuid("material_id").notNull().references(() => vocabulary.materialId), text: text("text").notNull(), position: ordinal(),
}, (t) => [unique("form_entry_identity").on(t.id, t.materialId), unique("form_entry_text").on(t.materialId, t.text), unique("form_entry_position").on(t.materialId, t.position), check("form_text", sql`length(${t.text})>0 and ${t.position}>=0`)])

export const vocabularyReadings = learning.table("vocabulary_readings", {
  id: uuid("id").primaryKey().defaultRandom(), materialId: uuid("material_id").notNull().references(() => vocabulary.materialId),
  kana: text("kana").notNull(), formScope: text("form_scope").$type<"all" | "restricted" | "kana-only">().notNull(), position: ordinal(),
}, (t) => [unique("reading_entry_identity").on(t.id, t.materialId), unique("reading_entry_text").on(t.materialId, t.kana), unique("reading_entry_position").on(t.materialId, t.position), check("reading_scope", sql`${t.formScope} in ('all','restricted','kana-only')`), check("reading_text", sql`length(${t.kana})>0 and ${t.position}>=0`)])

export const vocabularySenses = learning.table("vocabulary_senses", {
  id: uuid("id").primaryKey().defaultRandom(), materialId: uuid("material_id").notNull().references(() => vocabulary.materialId), position: ordinal(),
  english: jsonb("english").$type<string[]>().notNull(), partsOfSpeech: jsonb("parts_of_speech").$type<string[]>().notNull(),
  formScope: text("form_scope").$type<"all" | "restricted">().notNull(), readingScope: text("reading_scope").$type<"all" | "restricted">().notNull(),
}, (t) => [unique("sense_entry_identity").on(t.id, t.materialId), unique("sense_entry_position").on(t.materialId, t.position), check("sense_scopes", sql`${t.formScope} in ('all','restricted') and ${t.readingScope} in ('all','restricted')`), check("sense_glosses", sql`jsonb_typeof(${t.english})='array' and jsonb_array_length(${t.english})>0 and jsonb_typeof(${t.partsOfSpeech})='array' and ${t.position}>=0`)])

export const readingForms = learning.table("reading_forms", {
  materialId: uuid("material_id").notNull(), readingId: uuid("reading_id").notNull(), formId: uuid("form_id").notNull(),
}, (t) => [primaryKey({ columns: [t.readingId, t.formId] }), foreignKey({ columns: [t.readingId, t.materialId], foreignColumns: [vocabularyReadings.id, vocabularyReadings.materialId] }), foreignKey({ columns: [t.formId, t.materialId], foreignColumns: [vocabularyForms.id, vocabularyForms.materialId] })])

export const senseForms = learning.table("sense_forms", {
  materialId: uuid("material_id").notNull(), senseId: uuid("sense_id").notNull(), formId: uuid("form_id").notNull(),
}, (t) => [primaryKey({ columns: [t.senseId, t.formId] }), foreignKey({ columns: [t.senseId, t.materialId], foreignColumns: [vocabularySenses.id, vocabularySenses.materialId] }), foreignKey({ columns: [t.formId, t.materialId], foreignColumns: [vocabularyForms.id, vocabularyForms.materialId] })])

export const senseReadings = learning.table("sense_readings", {
  materialId: uuid("material_id").notNull(), senseId: uuid("sense_id").notNull(), readingId: uuid("reading_id").notNull(),
}, (t) => [primaryKey({ columns: [t.senseId, t.readingId] }), foreignKey({ columns: [t.senseId, t.materialId], foreignColumns: [vocabularySenses.id, vocabularySenses.materialId] }), foreignKey({ columns: [t.readingId, t.materialId], foreignColumns: [vocabularyReadings.id, vocabularyReadings.materialId] })])

export const vocabularyKanji = learning.table("vocabulary_kanji", {
  formId: uuid("form_id").notNull().references(() => vocabularyForms.id), kanjiId: uuid("kanji_id").notNull().references(() => kanji.materialId), position: ordinal(),
}, (t) => [primaryKey({ columns: [t.formId, t.position] }), check("word_kanji_position", sql`${t.position}>=0`)])

export const levelAssignments = learning.table("level_assignments", {
  id: uuid("id").primaryKey().defaultRandom(), materialId: uuid("material_id").notNull().references(() => materials.id),
  snapshotId: uuid("snapshot_id").notNull().references(() => sourceSnapshots.id),
  scheme: text("scheme").$type<"jlpt-current-approx" | "jlpt-pre2010">().notNull(), level: integer("level").notNull(), evidenceUrl: text("evidence_url").notNull(),
}, (t) => [unique("level_source_material").on(t.materialId, t.snapshotId, t.scheme), index("level_material_filter").on(t.scheme, t.level, t.materialId), check("level_scheme", sql`(${t.scheme}='jlpt-current-approx' and ${t.level} between 1 and 5) or (${t.scheme}='jlpt-pre2010' and ${t.level} between 1 and 4)`), check("level_evidence", sql`${t.evidenceUrl} like 'https://%'`)])

export const materialRevisions = learning.table("material_revisions", {
  id: uuid("id").primaryKey().defaultRandom(), materialId: uuid("material_id").notNull().references(() => materials.id),
  checksum: text("checksum").notNull(), payload: jsonb("payload").$type<unknown>().notNull(), createdAt: created(),
}, (t) => [unique("revision_material_identity").on(t.id, t.materialId), unique("revision_material_checksum").on(t.materialId, t.checksum), check("revision_hash", sql`${t.checksum} ~ '^[a-f0-9]{64}$'`)])

export const revisionSources = learning.table("revision_sources", {
  revisionId: uuid("revision_id").notNull().references(() => materialRevisions.id), snapshotId: uuid("snapshot_id").notNull().references(() => sourceSnapshots.id),
}, (t) => [primaryKey({ columns: [t.revisionId, t.snapshotId] })])

export const contentReviews = learning.table("content_reviews", {
  revisionId: uuid("revision_id").primaryKey().references(() => materialRevisions.id), reviewer: text("reviewer").notNull(), notes: text("notes").notNull(), reviewedAt: created(),
}, (t) => [check("review_identity", sql`length(trim(${t.reviewer}))>0 and length(trim(${t.notes}))>0`)])

export const contentReleases = learning.table("content_releases", {
  id: uuid("id").primaryKey().defaultRandom(), slug: text("slug").notNull().unique(),
  status: text("status").$type<"draft" | "published">().notNull().default("draft"), publisher: text("publisher"), createdAt: created(), publishedAt: timestamp("published_at", { withTimezone: true }),
}, (t) => [check("release_status", sql`(${t.status}='draft' and ${t.publishedAt} is null and ${t.publisher} is null) or (${t.status}='published' and ${t.publishedAt} is not null and length(trim(${t.publisher}))>0 and ${t.publisher} is not null)`), check("release_slug", sql`length(${t.slug}) between 1 and 120`)])

export const releaseItems = learning.table("release_items", {
  releaseId: uuid("release_id").notNull().references(() => contentReleases.id), materialId: uuid("material_id").notNull().references(() => materials.id), revisionId: uuid("revision_id").notNull(),
}, (t) => [primaryKey({ columns: [t.releaseId, t.materialId] }), foreignKey({ columns: [t.revisionId, t.materialId], foreignColumns: [materialRevisions.id, materialRevisions.materialId] }), index("release_revision").on(t.revisionId)])

export const activeRelease = learning.table("active_release", {
  slot: text("slot").primaryKey().default("public"), releaseId: uuid("release_id").notNull().references(() => contentReleases.id),
}, (t) => [check("active_release_slot", sql`${t.slot}='public'`)])

// Custom SQL owns this security-barrier view; runtime never reads the base editorial tables.
export const publishedMaterials = learning.view("published_materials", {
  id: uuid("id"), stableKey: text("stable_key"), kind: text("kind").$type<"kanji" | "vocabulary">(),
  releaseId: uuid("release_id"), revisionId: uuid("revision_id"), checksum: text("checksum"), payload: jsonb("payload").$type<unknown>(),
}).existing()
