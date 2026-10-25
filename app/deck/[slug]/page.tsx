import Link from "next/link"
import { notFound } from "next/navigation"
import { catalog, getDeck } from "@/lib/platform/repository"
import { PageHeading, CardGrid } from "@/components/platform/catalog"
export function generateStaticParams() {
  return catalog.decks.map((d) => ({ slug: d.slug }))
}
export const dynamicParams = false
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: `${getDeck((await params).slug)?.title ?? "Deck"} · Kana-Learn` }
}
export default async function DeckPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = getDeck((await params).slug)
  if (!d) notFound()
  return (
    <>
      <Link href={`/set/${d.set}`} className="breadcrumb">
        Collection / {catalog.sets.find((s) => s.slug === d.set)!.title}
      </Link>
      <PageHeading
        eyebrow={`${d.cardIds.length} CARDS · ${Math.ceil(d.cardIds.length / 3)} MIN READ-THROUGH`}
        title={d.title}
      >
        {d.description}
      </PageHeading>
      <div className="practice-invitation">
        <div>
          <span className="eyebrow">A FEW MINUTES, ALL YOURS</span>
          <h2>Meet the characters. Then try recalling them.</h2>
          <p>Reveal, rate, and return to the ones that need more time.</p>
        </div>
        <div className="practice-links">
          <Link className="primary-button" href={`/deck/${d.slug}/practice`}>
            Flashcards ↗
          </Link>
          <Link className="secondary-button" href={`/deck/${d.slug}/practice?mode=quiz`}>
            Quiz
          </Link>
          <Link className="secondary-button" href={`/deck/${d.slug}/practice?mode=review`}>
            Review
          </Link>
        </div>
      </div>
      <section>
        <h2>Inside this deck</h2>
        <CardGrid cards={d.cardIds.map((id) => catalog.cards.find((c) => c.id === id)!)} />
      </section>
    </>
  )
}
