import "server-only"
import { createApi } from "./app"
import { authConfig, isAuthConfigured } from "../config"
import { createAuthGateway } from "../auth/supabase"
import { getDatabase } from "../db/client"
import { createLearningService } from "../services/learning"

export const api = createApi({
  auth: createAuthGateway,
  learning: async () => createLearningService(await getDatabase()),
  origin: () => authConfig().origin,
  authConfigured: isAuthConfigured,
})
