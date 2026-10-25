import Link from "next/link"
import { ArrowUpRight, ArrowRight } from "lucide-react"
import type { CardSummary, Deck, StudySet } from "@/lib/platform/types"

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="page-heading">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{title}</h1>
      {children && <div className="heading-copy">{children}</div>}
    </div>
  )
}
export function SetTile({ set, count }: { set: StudySet; count: number }) {
  return (
    <Link href={`/set/${set.slug}`} className="set-tile">
      <div className="tile-top">
        <span className="set-symbol" lang="ja">
          {set.symbol}
        </span>
        <span className="meta">
          {count} DECKS <ArrowUpRight size={16} />
        </span>
      </div>
      <h3>{set.title}</h3>
      <p>{set.description}</p>
      <span className="text-link">
        Open notebook <ArrowRight size={16} />
      </span>
    </Link>
  )
}
export function DeckTile({ deck, cards }: { deck: Deck; cards: CardSummary[] }) {
  return (
    <Link href={`/deck/${deck.slug}`} className="deck-tile">
      <span className="meta">
        {deck.cardIds.length} CARDS ·{" "}
        {deck.method === "reading-trail" ? "READING TRAIL" : deck.kind.toUpperCase()}
      </span>
      <h3>{deck.title}</h3>
      <div className="deck-glyphs" lang="ja">
        {deck.cardIds.slice(0, 5).map((id) => (
          <span key={id}>{cards.find((c) => c.id === id)?.glyph}</span>
        ))}
      </div>
      <span className="text-link">
        Explore deck <ArrowUpRight size={16} />
      </span>
    </Link>
  )
}
export function CardGrid({ cards }: { cards: CardSummary[] }) {
  return (
    <div className="character-grid">
      {cards.map((c) => (
        <Link href={`/card/${c.id}`} className="character-tile" key={c.id}>
          <span lang="ja">{c.glyph}</span>
          <small>{c.meanings[0]}</small>
          {c.kind === "kanji" && (
            <small className="jlpt-badge">{c.jlpt ? `Approx. N${c.jlpt}` : "No JLPT label"}</small>
          )}
        </Link>
      ))}
    </div>
  )
}
