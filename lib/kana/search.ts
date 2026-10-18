import type { KanaCharacter } from "../../types/kana"

export function getCategoryGroup(category: string) {
  if (category.includes("handakuten")) return "handakuten"
  if (category.includes("dakuten")) return "dakuten"
  if (category.includes("combinations")) return "combination"
  return "basic"
}

export function filterKana(data: KanaCharacter[], type: "all" | KanaCharacter["type"], category: string, query: string) {
  const normalized = query.normalize("NFKC").trim().toLowerCase()
  return data.filter((kana) =>
    (type === "all" || kana.type === type) &&
    (category === "all" || getCategoryGroup(kana.category) === category) &&
    (!normalized || kana.character.normalize("NFKC").includes(normalized) || kana.romaji.toLowerCase().includes(normalized)),
  )
}
