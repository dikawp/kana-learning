import { createHash } from "node:crypto"
import { asc } from "drizzle-orm"
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core"
import { contentSchema } from "../../lib/content/contracts"
import * as schema from "../db/schema"

export async function readKanaContent(db: PgDatabase<PgQueryResultHKT, typeof schema>) {
  const items = await db.select({ id: schema.kana.id, character: schema.kana.character, romaji: schema.kana.romaji, type: schema.kana.type, category: schema.kana.category }).from(schema.kana).orderBy(asc(schema.kana.position))
  return contentSchema.parse({ revision: createHash("sha256").update(JSON.stringify(items)).digest("hex"), items })
}
