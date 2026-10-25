import Link from "next/link"
import { catalog } from "@/lib/platform/repository"
import { PageHeading, SetTile } from "@/components/platform/catalog"
export const metadata = { title: "JLPT Study Map · Kana-Learn" }
export default function JlptPage() {
  return (
    <>
      <PageHeading eyebrow="KANJI / FIVE STUDY PATHS" title="Your JLPT study map.">
        All 2,211 kanji in the N5–N1 lists from kanji-data 1.0.0, with a place to practice each one.
      </PageHeading>
      <p className="muted">
        Approximate source labels, not an official exam syllabus. Each level contains only its
        assigned cards; lower levels are separate. Vocabulary examples are not assigned vocabulary
        levels.
      </p>
      <section>
        <h2>From N5 to N1</h2>
        <div className="set-grid">
          {catalog.sets
            .filter((s) => s.slug.startsWith("jlpt-"))
            .map((s) => (
              <SetTile key={s.slug} set={s} count={s.decks.length} />
            ))}
        </div>
      </section>
      <section>
        <h2>Beyond level labels</h2>
        <p>
          Another 548 kanji have no JLPT assignment in this source. They remain available in the
          original notebooks, reading trails and search. Hiragana and Katakana retain their own
          learning paths.
        </p>
        <div className="link-pills">
          <Link href="/search">Search and filter cards</Link>
          <Link href="/archive#kanji">Explore the original notebooks</Link>
          <Link href="/sources">Sources and methodology</Link>
        </div>
      </section>
    </>
  )
}
