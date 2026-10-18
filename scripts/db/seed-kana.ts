import { sql } from "drizzle-orm"
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core"
import { kanaData } from "../../lib/kana-data"
import * as schema from "../../server/db/schema"

export async function seedKana(db: PgDatabase<PgQueryResultHKT, typeof schema>) {
  await db.insert(schema.kana).values(kanaData.map((entry, position) => ({ ...entry, position }))).onConflictDoUpdate({
    target: schema.kana.id,
    set: { character: sql`excluded.character`, romaji: sql`excluded.romaji`, type: sql`excluded.type`, category: sql`excluded.category`, position: sql`excluded.position` },
  })
}
