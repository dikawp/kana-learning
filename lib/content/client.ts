import { contentSchema } from "./contracts"

export async function loadKana(signal?: AbortSignal) {
  const response = await fetch("/api/v1/content/kana", { signal, credentials: "omit" })
  if (!response.ok) throw Error("Learning material is unavailable. Please retry.")
  const parsed = contentSchema.safeParse(await response.json())
  if (!parsed.success) throw Error("Learning material could not be validated. Please retry.")
  return parsed.data
}
