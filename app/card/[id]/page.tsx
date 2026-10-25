import Link from "next/link"
import { notFound } from "next/navigation"
import { catalog, getCard, relatedCards } from "@/lib/platform/repository"
import { PageHeading, DeckTile } from "@/components/platform/catalog"
import { ReadingText } from "@/components/platform/reading-text"
import { romanizeReading } from "@/lib/platform/romaji"
import { PrintCard } from "@/components/platform/print"
export function generateStaticParams() {
  return catalog.cards.map((c) => ({ id: c.id }))
}
export const dynamicParams = false
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = getCard((await params).id)
  return { title: `${c?.glyph ?? "Character"} · ${c?.meanings[0] ?? ""} · Kana-Learn` }
}
export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const c = getCard((await params).id)
  if (!c) notFound()
  const related = relatedCards(c)
  return (
    <article className="card-document">
      <Link href="/archive" className="breadcrumb no-print">
        Collection / {c.kind}
      </Link>
      <PageHeading
        eyebrow={`${c.kind.toUpperCase()} / CHARACTER NOTE`}
        title={`${c.glyph} — ${c.meanings[0]}`}
      />
      <div className="card-study-sheet">
        <div className="card-main-glyph" lang="ja">
          {c.glyph}
        </div>
        <div>
          <h2>{c.kind === "kanji" ? "Meanings" : "Reading"}</h2>
          <p className="card-meanings">{c.meanings.join(" · ")}</p>
          {c.kind === "kanji" ? (
            <>
              <dl className="readings">
                <dt>Onyomi</dt>
                <dd>
                  <ReadingText readings={c.on} />
                </dd>
                <dt>Kunyomi</dt>
                <dd>
                  <ReadingText readings={c.kun} />
                </dd>
                {c.names.length > 0 && (
                  <>
                    <dt>Name readings</dt>
                    <dd>
                      <ReadingText readings={c.names} />
                    </dd>
                  </>
                )}
              </dl>
              <div className="link-pills">
                {c.strokes !== null && <span>{c.strokes} strokes</span>}
                {c.grade !== null && <span>Grade {c.grade}</span>}
                {c.jlpt !== null ? (
                  <Link href={`/set/jlpt-n${c.jlpt}`}>Approx. JLPT N{c.jlpt}</Link>
                ) : (
                  <span>No JLPT label</span>
                )}
              </div>
            </>
          ) : (
            <p>
              {c.kind} · {c.group}
            </p>
          )}
        </div>
      </div>
      <PrintCard />
      {c.words.length > 0 && (
        <section>
          <h2>Words to meet it in</h2>
          <p className="muted">Dictionary examples, not a vocabulary-level curriculum.</p>
          <div className="word-grid">
            {c.words.map((w) => (
              <div key={w.written}>
                <h3 lang="ja">{w.written}</h3>
                <p lang="ja">{w.reading}</p>
                <p className="reading-romaji" lang="en">
                  Romaji: {romanizeReading(w.reading)}
                </p>
                <p>{w.meanings.slice(0, 3).join("; ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section>
          <h2>Connections to notice</h2>
          <div className="related-grid">
            {related.map((r) => (
              <Link href={`/card/${r.card.id}`} key={r.card.id}>
                <span lang="ja">{r.card.glyph}</span>
                <div>
                  {r.card.meanings[0]}
                  <small>{r.reason}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="no-print">
        <h2>Practice this character</h2>
        <div className="deck-grid">
          {catalog.decks
            .filter((d) => d.cardIds.includes(c.id))
            .map((d) => (
              <DeckTile key={d.slug} deck={d} cards={catalog.cards} />
            ))}
        </div>
      </section>
      <p className="source-credit">
        {c.kind === "kanji"
          ? "Dictionary data: EDRDG · kanjiapi.dev · kanji-data, CC BY-SA 4.0."
          : "Kana-Learn original kana reference."}{" "}
        <Link href="/sources">Sources and limitations</Link>
      </p>
    </article>
  )
}
