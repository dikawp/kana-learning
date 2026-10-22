import { z } from "zod"

const text = z.string().trim().min(1).max(500)
const key = z.string().min(1).max(120)
const ids = z.array(z.string().uuid()).max(1000)
export const provenanceSchema = z.object({
  snapshotId: z.string().uuid(), sourceId: key, version: text, sourceDate: text,
  checksum: z.string().regex(/^[a-f0-9]{64}$/), name: text, url: z.string().url().startsWith("https://"),
  license: text, licenseUrl: z.string().url().startsWith("https://"), attribution: z.string().min(1).max(4000),
}).strict()
export const levelSchema = z.object({
  scheme: z.enum(["jlpt-current-approx", "jlpt-pre2010"]), level: z.number().int().min(1).max(5),
  snapshotId: z.string().uuid(), evidenceUrl: z.string().url().startsWith("https://"),
}).strict().refine((v) => v.scheme !== "jlpt-pre2010" || v.level <= 4)
const common = { stableKey: key, sources: z.array(provenanceSchema).min(1).max(30), levels: z.array(levelSchema).max(30) }
export const kanjiDocument = z.object({
  ...common, kind: z.literal("kanji"), character: z.string().refine((v) => Array.from(v).length === 1),
  strokeCount: z.number().int().min(1).max(100).nullable(), grade: z.number().int().positive().nullable(),
  legacyJlpt: z.number().int().min(1).max(4).nullable(), meanings: z.array(text).min(1).max(100),
  readings: z.array(z.object({ kind: z.enum(["on", "kun", "nanori"]), raw: text, kana: text }).strict()).max(200),
}).strict()
const form = z.object({ id: z.string().uuid(), text }).strict()
const reading = z.object({ id: z.string().uuid(), kana: text, formScope: z.enum(["all", "restricted", "kana-only"]), formIds: ids }).strict()
const sense = z.object({ id: z.string().uuid(), english: z.array(text).min(1).max(100), partsOfSpeech: z.array(text).max(100),
  formScope: z.enum(["all", "restricted"]), formIds: ids, readingScope: z.enum(["all", "restricted"]), readingIds: ids }).strict()
export const vocabularyDocument = z.object({
  ...common, kind: z.literal("vocabulary"), forms: z.array(form).max(100), readings: z.array(reading).min(1).max(100), senses: z.array(sense).min(1).max(100),
}).strict()
export const dictionaryDocument = z.discriminatedUnion("kind", [kanjiDocument, vocabularyDocument]).superRefine((d, context) => {
  const snapshots = new Set(d.sources.map((s) => s.snapshotId))
  let invalid = snapshots.size !== d.sources.length || d.levels.some((l) => !snapshots.has(l.snapshotId))
  if (d.kind === "vocabulary") {
    const forms = new Set(d.forms.map((f) => f.id)), readings = new Set(d.readings.map((r) => r.id))
    const restricted = (scope: string, values: string[], allowed: Set<string>) =>
      new Set(values).size !== values.length || values.some((id) => !allowed.has(id)) || (scope === "restricted" ? values.length === 0 : values.length !== 0)
    invalid ||= forms.size !== d.forms.length || readings.size !== d.readings.length || new Set(d.senses.map((s) => s.id)).size !== d.senses.length ||
      d.readings.some((r) => restricted(r.formScope, r.formIds, forms)) ||
      d.senses.some((s) => restricted(s.formScope, s.formIds, forms) || restricted(s.readingScope, s.readingIds, readings))
    invalid ||= d.senses.some((s) => !d.readings.some((r) => {
      if (s.readingScope === "restricted" && !s.readingIds.includes(r.id)) return false
      if (r.formScope === "kana-only" || d.forms.length === 0) return s.formScope === "all"
      const permitted = r.formScope === "all" ? d.forms.map((f) => f.id) : r.formIds
      return permitted.some((id) => s.formScope === "all" || s.formIds.includes(id))
    }))
  }
  if (invalid) context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid dictionary relationships or provenance" })
})
export type DictionaryDocument = z.infer<typeof dictionaryDocument>
export type Provenance = z.infer<typeof provenanceSchema>
export type DictionaryKind = DictionaryDocument["kind"]
