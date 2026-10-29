import { notFound } from "next/navigation"
import Link from "next/link"
import { catalog, getSet } from "@/lib/platform/repository"
import { PageHeading, DeckTile } from "@/components/platform/catalog"
export function generateStaticParams() {
  return catalog.sets.map((s) => ({ slug: s.slug }))
}
export const dynamicParams = false
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = getSet((await params).slug)
  return { title: `${s?.title ?? "Notebook"} · Kana-Learn` }
}
export default async function SetPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = getSet((await params).slug)
  if (!s) notFound()
  return (
    <>
      <Link href="/archive" className="breadcrumb">
        Collection / {s.kind}
      </Link>
      <PageHeading eyebrow={`${s.decks.length} DECKS · ${s.kind.toUpperCase()}`} title={s.title}>
        {s.description}
      </PageHeading>
      <Link className="primary-button" href={`/deck/${s.decks[0]}/practice`}>
        Start the first deck ↗
      </Link>
      {s.slug.startsWith("jlpt-") && (
        <p>
          <Link href={`/jlpt/${s.slug.slice(5)}`}>
            Open the full {s.slug.slice(5).toUpperCase()} learning notebook →
          </Link>
        </p>
      )}
      <section>
        <div className="deck-grid">
          {s.decks.map((slug) => (
            <DeckTile
              key={slug}
              deck={catalog.decks.find((d) => d.slug === slug)!}
              cards={catalog.cards}
            />
          ))}
        </div>
      </section>
      {s.kind !== "kanji" && (
        <section>
          <h2>Reference table</h2>
          <div className="reference-scroll">
            <table>
              <caption>{s.title} — all 104 entries</caption>
              <thead>
                <tr>
                  <th scope="col">Character</th>
                  <th scope="col">Romaji</th>
                  <th scope="col">Group</th>
                </tr>
              </thead>
              <tbody>
                {catalog.cards
                  .filter((c) => c.kind === s.kind)
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/card/${c.id}`} lang="ja">
                          {c.glyph}
                        </Link>
                      </td>
                      <td>{c.readings[0]}</td>
                      <td>{c.group}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
