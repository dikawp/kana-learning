import { z } from "zod"

export const kanaSchema = z.object({
  id: z.string().min(1).max(40), character: z.string().min(1).max(8),
  romaji: z.string().min(1).max(40), type: z.enum(["hiragana", "katakana"]), category: z.string().min(1).max(80),
}).strict()
export const contentSchema = z.object({
  revision: z.string().regex(/^[a-f0-9]{64}$/), items: z.array(kanaSchema).min(1).max(1000),
}).strict().refine(({ items }) => new Set(items.map((item) => item.id)).size === items.length, "Duplicate kana IDs")
export type KanaContent = z.infer<typeof contentSchema>
