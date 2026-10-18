import { Elysia, t } from "elysia"
import { ApiError } from "./errors"
import type { AuthGateway } from "../auth/gateway"
import type { LearningService } from "../services/learning"

export type ApiDependencies = {
  auth: () => Promise<AuthGateway>
  learning: () => Promise<LearningService>
  origin: () => string
  authConfigured: () => boolean
}
const uuid = t.String({ format: "uuid" })
const script = t.Union([t.Literal("all"), t.Literal("hiragana"), t.Literal("katakana")])
const object = <T extends Parameters<typeof t.Object>[0]>(properties: T) => t.Object(properties, { additionalProperties: false })
const email = t.String({ format: "email", maxLength: 254 })
const password = t.String({ minLength: 8, maxLength: 128 })

async function readJson(request: Request) {
  if (!request.body) throw new ApiError(400, "INVALID_JSON", "A JSON body is required.")
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    length += value.length
    if (length > 16384) { await reader.cancel(); throw new ApiError(413, "BODY_TOO_LARGE", "Request body is too large.") }
    chunks.push(value)
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown } catch { throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.") }
}

export function createApi(deps: ApiDependencies) {
  const verified = async () => {
    const auth = await deps.auth()
    const user = await auth.user()
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to use account practice.")
    return { auth, user }
  }
  return new Elysia({ prefix: "/api/v1", normalize: false })
    .onRequest(({ request, set }) => {
      set.headers["cache-control"] = "private, no-store"
      set.headers["x-request-id"] = crypto.randomUUID()
      set.headers["vary"] = "Cookie"
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && request.headers.get("origin") !== deps.origin()) {
        throw new ApiError(403, "ORIGIN_REJECTED", "Request origin is not allowed.")
      }
    })
    .onParse(async ({ request, contentType }) => {
      if (contentType !== "application/json") throw new ApiError(415, "JSON_REQUIRED", "Use application/json.")
      return readJson(request)
    })
    .onError(({ code, error, set }) => {
      const known = error instanceof ApiError ? error : "cause" in error && error.cause instanceof ApiError ? error.cause : null
      const status = known?.status ?? (code === "VALIDATION" ? 422 : code === "PARSE" ? 400 : code === "NOT_FOUND" ? 404 : 503)
      set.status = status
      set.headers["cache-control"] = "private, no-store"
      const requestId = String(set.headers["x-request-id"] ?? crypto.randomUUID())
      return { error: { code: known?.code ?? (status === 422 ? "INVALID_REQUEST" : status === 404 ? "NOT_FOUND" : status === 400 ? "INVALID_JSON" : "SERVICE_UNAVAILABLE"), message: known?.message ?? (status === 422 ? "Request does not match the API contract." : status === 404 ? "Resource was not found." : status === 400 ? "Request body must be valid JSON." : "Account service is temporarily unavailable."), requestId } }
    })
    .get("/health", () => ({ authConfigured: deps.authConfigured() }))
    .get("/auth/session", async () => ({ configured: deps.authConfigured(), user: deps.authConfigured() ? await (await deps.auth()).user() : null }))
    .post("/auth/sign-in", async ({ body }) => { await (await deps.auth()).signIn(body.email, body.password); return { ok: true } }, { body: object({ email, password }) })
    .post("/auth/sign-up", async ({ body }) => { await (await deps.auth()).signUp(body.email, body.password); return { message: "If registration is available, check your email to confirm your account." } }, { body: object({ email, password }) })
    .post("/auth/recover", async ({ body }) => { await (await deps.auth()).recover(body.email); return { message: "If an account exists, a recovery link will be sent." } }, { body: object({ email }) })
    .post("/auth/password", async ({ body }) => { const { auth } = await verified(); await auth.updatePassword(body.password); return { ok: true } }, { body: object({ password }) })
    .post("/auth/sign-out", async () => { await (await deps.auth()).signOut(); return { ok: true } }, { body: object({}) })
    .get("/content/kana", async () => ({ items: await (await deps.learning()).content() }))
    .get("/me/progress", async () => { const { user } = await verified(); return (await deps.learning()).progress(user.id) })
    .put("/me/progress", async ({ body }) => { const { user } = await verified(); return (await deps.learning()).setFamiliar(user.id, body.requestId, body.kanaId, body.familiar) }, { body: object({ requestId: uuid, kanaId: t.String({ minLength: 1, maxLength: 40 }), familiar: t.Boolean() }) })
    .post("/me/progress/reset", async ({ body }) => { const { user } = await verified(); return (await deps.learning()).reset(user.id, body.requestId, body.type) }, { body: object({ requestId: uuid, type: script }) })
    .post("/quiz-sessions", async ({ body }) => { const { user } = await verified(); return (await deps.learning()).startQuiz(user.id, body.requestId, { type: body.type, questionCount: body.questionCount }) }, { body: object({ requestId: uuid, type: script, questionCount: t.Union([t.Literal(5), t.Literal(10), t.Literal(15), t.Literal(20), t.Literal(25)]) }) })
    .get("/quiz-sessions", async ({ query }) => { const { user } = await verified(); return (await deps.learning()).history(user.id, query.limit ?? 10, query.cursor) }, { query: object({ limit: t.Optional(t.Numeric({ minimum: 1, maximum: 25, multipleOf: 1 })), cursor: t.Optional(uuid) }) })
    .get("/quiz-sessions/:id", async ({ params }) => { const { user } = await verified(); return (await deps.learning()).quiz(user.id, params.id) }, { params: object({ id: uuid }) })
    .post("/quiz-sessions/:id/answers", async ({ body, params }) => { const { user } = await verified(); return (await deps.learning()).answer(user.id, body.requestId, params.id, body.questionId, body.answer) }, { params: object({ id: uuid }), body: object({ requestId: uuid, questionId: uuid, answer: t.String({ minLength: 1, maxLength: 64 }) }) })
    .post("/quiz-sessions/:id/complete", async ({ body, params }) => { const { user } = await verified(); return (await deps.learning()).complete(user.id, body.requestId, params.id) }, { params: object({ id: uuid }), body: object({ requestId: uuid }) })
}
