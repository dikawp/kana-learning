import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve, sep } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { expect, it } from "vitest"
import * as schema from "../../server/db/schema"
import { seedKana } from "../../scripts/db/seed-kana"
import { readKanaContent } from "../../server/services/content"

it("revokes table/column grants without deleting dormant records and preserves content after reopen", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kana-content-test-"))
  const absolute = resolve(directory)
  if (!absolute.startsWith(resolve(tmpdir()) + sep) || !absolute.includes("kana-content-test-")) throw Error("Unsafe test cleanup")
  let pg: PGlite | undefined
  try {
    pg = new PGlite(directory)
    await pg.exec("create schema auth; create table auth.users(id uuid primary key)")
    for (const file of ["0000_c2_foundation", "0001_c2_security", "0002_c2_score_constraint"]) {
      const sql = await readFile("drizzle/" + file + ".sql", "utf8")
      await pg.exec(sql)
    }
    let db = drizzle(pg, { schema })
    await seedKana(db)
    const id = "11111111-1111-4111-8111-111111111111"
    await pg.query("insert into auth.users values ($1)", [id])
    await pg.query("insert into learning.profiles(id) values ($1)", [id])
    await pg.query("insert into learning.kana_familiarity(profile_id,kana_id) values ($1,'h-a')", [id])
    await pg.exec(await readFile("drizzle/0003_content_read_only.sql", "utf8"))
    expect((await pg.query("select * from learning.profiles")).rows).toHaveLength(1)
    expect((await pg.query("select * from learning.kana_familiarity")).rows).toHaveLength(1)
    expect((await pg.query("select * from auth.users")).rows).toHaveLength(1)
    await pg.exec("set role learning_runtime")
    const before = await readKanaContent(db)
    await pg.close()
    pg = new PGlite(directory)
    db = drizzle(pg, { schema })
    await pg.exec("set role learning_runtime")
    expect(await readKanaContent(db)).toEqual(before)
    await expect(pg.exec("select * from learning.profiles")).rejects.toMatchObject({ code: "42501" })
    await expect(pg.exec("update learning.profiles set id=id")).rejects.toMatchObject({ code: "42501" })
  } finally { await pg?.close(); await rm(absolute, { recursive: true, force: true }) }
}, 60000)
