import { Elysia, t } from "elysia"
import { ApiError } from "./errors"
import type { KanaContent } from "../../lib/content/contracts"
import type { DictionaryService } from "../services/dictionary"
import { validateDictionaryQuery } from "../services/dictionary"

export function createApi(deps: { content: () => Promise<KanaContent>; configured: () => boolean; dictionary: () => Promise<DictionaryService> }) {
  const query = t.Object({ q: t.Optional(t.String({ maxLength: 100 })), level: t.Optional(t.String({ pattern: "^[0-9]+$", maxLength: 2 })),
    limit: t.Optional(t.String({ pattern: "^[0-9]+$", maxLength: 3 })), cursor: t.Optional(t.String({ maxLength: 1024 })) }, { additionalProperties: false })
  const params = t.Object({ key: t.String({ minLength: 1, maxLength: 120 }) }, { additionalProperties: false })
  return new Elysia({ prefix: "/api/v1", normalize: false })
    .onRequest(({ set }) => {
      set.headers["cache-control"] = "private, no-store"
      set.headers["x-request-id"] = crypto.randomUUID()
    })
    .onError(({ code, error, set }) => {
      const known = error instanceof ApiError ? error : null
      const status = known?.status ?? (code === "VALIDATION" ? 422 : code === "NOT_FOUND" ? 404 : 503)
      set.status = status
      set.headers["cache-control"] = "private, no-store"
      return { error: { code: known?.code ?? (status === 404 ? "NOT_FOUND" : status === 422 ? "INVALID_REQUEST" : "SERVICE_UNAVAILABLE"), message: known?.message ?? (status === 404 ? "Resource was not found." : status === 422 ? "Request does not match the API contract." : "Learning material is temporarily unavailable."), requestId: String(set.headers["x-request-id"] ?? crypto.randomUUID()) } }
    })
    .get("/health", () => ({ contentConfigured: deps.configured(), liveDependencyCheck: false }))
    .get("/content/kana", async ({ set, request }) => {
      const content = await deps.content()
      const etag = '"' + content.revision + '"'
      set.headers["etag"] = etag
      set.headers["cache-control"] = "public, max-age=0, must-revalidate"
      if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { etag, "cache-control": "public, max-age=0, must-revalidate" } })
      return content
    }, { query: t.Object({}, { additionalProperties: false }) })
    .get("/content/kanji", async ({ query }) => {
      const validated = validateDictionaryQuery(query, "kanji")
      return (await deps.dictionary()).list("kanji", validated)
    }, { query })
    .get("/content/kanji/:key", async ({ params }) => (await deps.dictionary()).detail("kanji", params.key), { params })
    .get("/content/vocabulary", async ({ query }) => {
      const validated = validateDictionaryQuery(query, "vocabulary")
      return (await deps.dictionary()).list("vocabulary", validated)
    }, { query })
    .get("/content/vocabulary/:key", async ({ params }) => (await deps.dictionary()).detail("vocabulary", params.key), { params })
}
