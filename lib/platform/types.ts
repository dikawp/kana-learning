export type Kind = "hiragana" | "katakana" | "kanji"
export type CardSummary = {
  id: string
  glyph: string
  kind: Kind
  meanings: string[]
  readings: string[]
  group?: string
  jlpt?: number | null
}
export type StudyCard = CardSummary & {
  romaji?: string
  on: string[]
  kun: string[]
  names: string[]
  strokes: number | null
  grade: number | null
  jlpt: number | null
  frequency: number | null
  words: { written: string; reading: string; meanings: string[] }[]
}
export type Deck = {
  slug: string
  set: string
  title: string
  description: string
  kind: Kind
  cardIds: string[]
  method: "topic" | "reading-trail" | "kana" | "jlpt"
}
export type StudySet = {
  slug: string
  title: string
  description: string
  kind: Kind
  symbol: string
  decks: string[]
}
export type Catalog = { revision: string; cards: CardSummary[]; decks: Deck[]; sets: StudySet[] }
