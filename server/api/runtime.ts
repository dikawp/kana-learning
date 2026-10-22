import "server-only"
import { createApi } from "./app"
import { getDatabase } from "../db/client"
import { readKanaContent } from "../services/content"
import { createDictionaryService } from "../services/dictionary"

export const api = createApi({
  content: async () => readKanaContent(await getDatabase()),
  configured: () => Boolean(process.env.DATABASE_URL?.trim()),
  dictionary: async () => createDictionaryService(await getDatabase()),
})
