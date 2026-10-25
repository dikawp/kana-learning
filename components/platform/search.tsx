"use client"
import { romanizeReading } from "@/lib/platform/romaji"
import { useMemo, useState } from "react"
import Link from "next/link"
import type { Catalog, Kind } from "@/lib/platform/types"
import { CardGrid, DeckTile, PageHeading } from "./catalog"

export function CatalogSearch({ catalog, initial = "" }: { catalog: Catalog; initial?: string }) {
  const [query, setQuery] = useState(initial),
    [kind, setKind] = useState<Kind | "all">("all"),
    [page, setPage] = useState(1)
  const [level, setLevel] = useState("all")
  const q = query.normalize("NFKC").trim().toLowerCase()
  const matches = (values: string[]) =>
    !q || values.some((s) => s.normalize("NFKC").toLowerCase().includes(q))
  const searchable = useMemo(
    () =>
      catalog.cards.map((c) => ({
        card: c,
        terms: [
          c.glyph,
          ...c.meanings,
          ...c.readings,
          ...(c.kind === "kanji" ? c.readings.map(romanizeReading) : []),
        ],
      })),
    [catalog.cards],
  )
  const cards = searchable
    .filter(
      ({ card: c, terms }) =>
        (kind === "all" || c.kind === kind) &&
        (level === "all" ||
          (c.kind === "kanji" &&
            (level === "unassigned" ? c.jlpt == null : c.jlpt === Number(level)))) &&
        matches(terms),
    )
    .map(({ card }) => card)
  const decks = q
    ? catalog.decks.filter(
        (d) =>
          (kind === "all" || d.kind === kind) &&
          (level === "all" || d.set === `jlpt-n${level}`) &&
          matches([d.title, d.description]),
      )
    : []
  const sets = q
    ? catalog.sets.filter(
        (s) =>
          (kind === "all" || s.kind === kind) &&
          (level === "all" || s.slug === `jlpt-n${level}`) &&
          matches([s.title, s.description]),
      )
    : []
  return (
    <>
      <PageHeading eyebrow="THE COLLECTION / SEARCH" title="Find your next discovery.">
        Look for a character, reading, meaning, deck, or notebook.
      </PageHeading>
      <form className="search-form" onSubmit={(e) => e.preventDefault()}>
        <label>
          Search the collection
          <input
            type="search"
            value={query}
            placeholder="Try あ, nichi, water, or a deck name"
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
          />
        </label>
        <label>
          Writing system
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind | "all")
              if (e.target.value !== "kanji") setLevel("all")
              setPage(1)
            }}
          >
            <option value="all">All characters</option>
            <option value="hiragana">Hiragana</option>
            <option value="katakana">Katakana</option>
            <option value="kanji">Kanji</option>
          </select>
        </label>
        <label>
          JLPT level
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value)
              setPage(1)
              if (e.target.value !== "all") setKind("kanji")
            }}
          >
            <option value="all">All levels</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                Approx. N{n}
              </option>
            ))}
            <option value="unassigned">No JLPT label</option>
          </select>
        </label>
      </form>
      <p className="muted">
        JLPT labels follow the source mapping. Each level is separate, not cumulative.{" "}
        <Link href="/jlpt">Explore the JLPT study map →</Link>
      </p>
      <p role="status" className="muted">
        {cards.length} characters · {decks.length} decks · {sets.length} notebooks
      </p>
      {sets.length > 0 && (
        <section>
          <h2>Notebooks</h2>
          <div className="link-pills">
            {sets.map((s) => (
              <Link key={s.slug} href={`/set/${s.slug}`}>
                {s.title}
              </Link>
            ))}
          </div>
        </section>
      )}
      {decks.length > 0 && (
        <section>
          <h2>Decks</h2>
          <div className="deck-grid">
            {decks.slice(0, 12).map((d) => (
              <DeckTile key={d.slug} deck={d} cards={catalog.cards} />
            ))}
          </div>
        </section>
      )}
      <section>
        <h2>Characters</h2>
        {cards.length ? (
          <CardGrid cards={cards.slice(0, page * 72)} />
        ) : (
          <div className="empty-state">
            No matching characters. Try another reading or clear the filters.
          </div>
        )}
        {cards.length > page * 72 && (
          <button className="secondary-button load-more" onClick={() => setPage((p) => p + 1)}>
            Show more characters
          </button>
        )}
      </section>
    </>
  )
}
