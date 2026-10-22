import { sql } from "drizzle-orm"
import type { KanaCharacter } from "../../types/kana"
import { pgSchema, text, integer, unique, check } from "drizzle-orm/pg-core"
const learning = pgSchema("learning")
export * from "./content-schema"
export const kana = learning.table("kana", {
  id: text("id").primaryKey(),
  character: text("character").notNull(),
  romaji: text("romaji").notNull(),
  type: text("type").$type<KanaCharacter["type"]>().notNull(),
  category: text("category").notNull(),
  position: integer("position").notNull(),
}, (t) => [
  unique("kana_script_glyph").on(t.type, t.character),
  unique("kana_position").on(t.position),
  check("kana_script", sql`${t.type} in ('hiragana', 'katakana')`),
  check("kana_text", sql`length(${t.character}) > 0 and length(${t.romaji}) > 0 and ${t.position} >= 0`),
])
