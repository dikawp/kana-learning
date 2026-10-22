import { Elysia, t } from "elysia"
import { ApiError } from "./errors"
import type { KanaContent } from "../../lib/content/contracts"

export function createApi(deps: { content: () => Promise<KanaContent>; configured: () => boolean }) {
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
}
