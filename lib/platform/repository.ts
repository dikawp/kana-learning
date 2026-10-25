import "server-only"
import catalogJson from "@/content/generated/catalog.json"
import cardsJson from "@/content/generated/cards.json"
import type { Catalog, StudyCard } from "./types"

export const catalog = catalogJson as Catalog
const cards = cardsJson as StudyCard[]
const cardIndex = new Map(cards.map((c) => [c.id, c]))
export const getCard = (id: string) => cardIndex.get(id)
export const getDeck = (slug: string) => catalog.decks.find((d) => d.slug === slug)
export const getSet = (slug: string) => catalog.sets.find((s) => s.slug === slug)
export const getDeckCards = (slug: string) =>
  getDeck(slug)?.cardIds.map((id) => cardIndex.get(id)!) ?? []
export function relatedCards(card: StudyCard) {
  const own = new Set(card.meanings.map((s) => s.toLowerCase()))
  return catalog.cards
    .filter((c) => c.id !== card.id && c.kind === card.kind)
    .map((c) => {
      const reading = c.readings.find((r) => card.readings.includes(r))
      const meaning = c.meanings.find((m) => own.has(m.toLowerCase()))
      return {
        card: c,
        reason: reading
          ? `Shared reading: ${reading}`
          : meaning
            ? `Shared meaning: ${meaning}`
            : "",
        score: Number(Boolean(reading)) * 2 + Number(Boolean(meaning)),
      }
    })
    .filter((c) => c.score)
    .sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id))
    .slice(0, 6)
}
