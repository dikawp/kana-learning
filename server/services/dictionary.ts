import { and, asc, eq, gt, ilike, or, sql } from "drizzle-orm"
import { createHash } from "node:crypto"
import { z } from "zod"
import { dictionaryDocument, type DictionaryKind } from "../../lib/content/dictionary"
import type { ContentDatabase } from "../content/revisions"
import * as s from "../db/schema"
import { ApiError } from "../api/errors"

const querySchema = z.object({ q: z.string().max(100).optional(), level: z.coerce.number().int().min(1).max(5).optional(),
  cursor: z.string().max(1024).optional(), limit: z.coerce.number().int().min(1).max(50).optional() }).strict()
export type DictionaryQuery = z.infer<typeof querySchema>
const cursorScope = (kind: DictionaryKind, query: DictionaryQuery) => createHash("sha256").update(JSON.stringify({ kind, q: query.q?.trim() ?? "", level: query.level ?? null })).digest("hex")
export function validateDictionaryQuery(input: unknown, kind: DictionaryKind): DictionaryQuery {
  const result = querySchema.safeParse(input)
  if (!result.success) throw new ApiError(422, "INVALID_REQUEST", "Invalid dictionary query.")
  if (result.data.cursor) decodeCursor(result.data.cursor, cursorScope(kind, result.data))
  return result.data
}
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (character) => "\\" + character)
const cursorSchema = z.object({ release: z.string().uuid(), key: z.string().min(1).max(120), scope: z.string().regex(/^[a-f0-9]{64}$/) }).strict()
function decodeCursor(token: string, scope: string) {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(token)) throw Error()
    const cursor = cursorSchema.parse(JSON.parse(Buffer.from(token, "base64url").toString("utf8")))
    if (cursor.scope !== scope) throw Error()
    return cursor
  } catch { throw new ApiError(422, "INVALID_CURSOR", "Cursor does not match the dictionary query.") }
}

export function createDictionaryService(db: ContentDatabase) {
  const view = s.publishedMaterials
  return {
    async list(kind: DictionaryKind, query: DictionaryQuery) {
      query = validateDictionaryQuery(query, kind)
      const limit = query.limit ?? 20
      const scope = cursorScope(kind, query)
      const cursor = query.cursor ? decodeCursor(query.cursor, scope) : undefined
      return db.transaction(async (tx) => {
      const [active] = await tx.select({ id: view.releaseId }).from(view).limit(1)
      if (cursor && cursor.release !== active?.id) throw new ApiError(409, "CONTENT_CHANGED", "Published content changed. Restart the list.")
      const filter = and(eq(view.kind, kind), cursor ? gt(view.stableKey, cursor.key) : undefined,
        query.q?.trim() ? or(ilike(view.stableKey, "%" + escapeLike(query.q.trim()) + "%"), sql`concat_ws(' ', ${view.payload}->>'character', ${view.payload}->'meanings', ${view.payload}->'readings', ${view.payload}->'forms', ${view.payload}->'senses') ilike ${"%" + escapeLike(query.q.trim()) + "%"}`) : undefined,
        query.level ? sql`${view.payload} @> ${JSON.stringify({ levels: [{ scheme: "jlpt-current-approx", level: query.level }] })}::jsonb` : undefined)
      const rows = await tx.select().from(view).where(filter).orderBy(asc(view.stableKey)).limit(limit + 1)
      const page = rows.slice(0, limit)
      return { releaseId: active?.id ?? null, items: page.map((row) => ({ id: row.id, revisionId: row.revisionId, checksum: row.checksum, ...dictionaryDocument.parse(row.payload) })),
        nextCursor: rows.length > limit ? Buffer.from(JSON.stringify({ release: active!.id, key: page.at(-1)!.stableKey, scope })).toString("base64url") : null }
      }, { isolationLevel: "repeatable read", accessMode: "read only" })
    },
    async detail(kind: DictionaryKind, key: string) {
      const [row] = await db.select().from(view).where(and(eq(view.kind, kind), eq(view.stableKey, key)))
      if (!row) throw new ApiError(404, "MATERIAL_NOT_FOUND", "Published material was not found.")
      return { id: row.id, revisionId: row.revisionId, releaseId: row.releaseId, checksum: row.checksum, ...dictionaryDocument.parse(row.payload) }
    },
  }
}
export type DictionaryService = ReturnType<typeof createDictionaryService>
