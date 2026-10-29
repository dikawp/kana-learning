import { z } from "zod"
import { levels } from "./types"

const text = z.string().trim().min(1)
const ids = z.array(text).refine((items) => new Set(items).size === items.length, "Duplicate IDs")
export const sourceSchema = z
  .object({
    id: text,
    title: text,
    url: text,
    license: text,
    attribution: text,
    revision: text,
    usage: z.enum(["original", "reference", "adapted"]),
  })
  .strict()
export const summarySchema = z
  .object({
    id: text,
    version: z.number().int().positive(),
    level: z.enum(levels),
    skill: z.enum(["moji-goi", "bunpou", "dokkai"]),
    kind: z.enum(["vocabulary", "grammar", "reading"]),
    title: text,
    meaning: text,
    objective: text,
    tags: ids,
    sourceIds: ids.min(1),
    editorialStatus: z.enum(["unreviewed", "machine-checked", "human-reviewed"]),
    origin: z.enum(["ai-assisted", "human-authored", "adapted"]),
    levelBasis: text,
    reading: text.optional(),
    romaji: text.optional(),
    textType: text.optional(),
    characterCount: z.number().int().nonnegative().optional(),
  })
  .strict()
export const materialSchema = summarySchema
  .extend({
    reading: text.optional(),
    partOfSpeech: text.optional(),
    forms: ids.optional(),
    formation: text.optional(),
    explanation: text,
    register: text.optional(),
    cautions: z.array(text).optional(),
    examples: z.array(
      z
        .object({
          japanese: text,
          reading: text,
          translation: text,
          furigana: text.optional(),
          sourceUrl: text.optional(),
          sourceId: text.optional(),
        })
        .strict(),
    ),
    blocks: z.array(z.object({ id: text, text, reading: text.optional() }).strict()).optional(),
    translation: text.optional(),
    textType: text.optional(),
    kanjiIds: ids,
    relatedIds: ids,
    comparisons: z.array(z.object({ materialId: text, explanation: text }).strict()).optional(),
    provenance: z
      .object({
        dataset: text,
        entryId: text,
        revision: text,
        url: z.url(),
        jmdictId: z.number().int().positive().optional(),
        license: text,
      })
      .strict()
      .optional(),
  })
  .strict()
export const questionSchema = z
  .object({
    id: text,
    version: z.number().int().positive(),
    level: z.enum(levels),
    skill: z.enum(["moji-goi", "bunpou", "dokkai"]),
    type: z.enum([
      "reading",
      "orthography",
      "context",
      "paraphrase",
      "usage",
      "word-formation",
      "grammar-form",
      "sentence-composition",
      "text-grammar",
      "short-reading",
      "information-retrieval",
      "word-meaning",
      "grammar-meaning",
      "example-translation",
    ]),
    materialId: text,
    conceptId: text,
    variantGroup: text,
    prompt: text,
    options: z
      .array(z.object({ id: text, label: text }).strict())
      .min(2)
      .max(6),
    answerId: text,
    explanation: text,
    distractors: z.record(text, text),
    evidence: z.object({ blockId: text, quote: text }).strict().optional(),
    sourceIds: ids.min(1),
    method: z.enum(["source-derived", "ai-assisted"]).optional(),
    sourceRevision: text.optional(),
    context: z
      .object({
        title: text,
        blocks: z.array(z.object({ id: text, text, reading: text.optional() }).strict()).min(1),
        translation: text.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((q, context) => {
    const optionIds = q.options.map((o) => o.id)
    if (
      new Set(optionIds).size !== optionIds.length ||
      new Set(q.options.map((o) => o.label.normalize("NFKC").trim())).size !== q.options.length
    )
      context.addIssue({ code: "custom", message: "Option IDs and labels must be unique" })
    if (!optionIds.includes(q.answerId))
      context.addIssue({ code: "custom", message: "Answer must name an option" })
    if (
      Object.keys(q.distractors).sort().join() !==
      optionIds
        .filter((id) => id !== q.answerId)
        .sort()
        .join()
    )
      context.addIssue({ code: "custom", message: "Every wrong option needs exactly one reason" })
    if (q.skill === "dokkai" && (!q.evidence || !q.context))
      context.addIssue({
        code: "custom",
        message: "Reading questions need evidence and passage context",
      })
    if (
      q.context &&
      new Set(q.context.blocks.map((block) => block.id)).size !== q.context.blocks.length
    )
      context.addIssue({ code: "custom", message: "Passage block IDs must be unique" })
    if (
      q.evidence &&
      q.context &&
      !q.context.blocks
        .find((block) => block.id === q.evidence!.blockId)
        ?.text.includes(q.evidence.quote)
    )
      context.addIssue({ code: "custom", message: "Evidence must occur in the passage snapshot" })
  })
