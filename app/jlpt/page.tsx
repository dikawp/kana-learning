import Link from "next/link"
import { PageHeading } from "@/components/platform/catalog"
import { CoverageNote, LevelNav } from "@/components/jlpt/navigation"
import { levels, skills, skillLabels } from "@/lib/jlpt/types"
import { getCoverage, getProgressIndex } from "@/lib/jlpt/repository"
import styles from "@/components/jlpt/jlpt.module.css"
import { JlptOverview } from "@/components/jlpt/progress"
export const metadata = { title: "JLPT Learning Hub · Kana-Learn" }
export default function JlptPage() {
  const coverage = getCoverage()
  return (
    <>
      <PageHeading
        eyebrow="JLPT / YOUR STUDY NOTEBOOK"
        title="Build your Japanese, one unit at a time."
      >
        Learn vocabulary, grammar and reading in English, with practice and review from N5 to N1.
      </PageHeading>
      <CoverageNote />
      <LevelNav />
      <JlptOverview materials={getProgressIndex()} />
      <section>
        <h2>From N5 to N1</h2>
        <div className={styles.grid}>
          {levels.map((level) => (
            <article key={level} className={styles.card}>
              <h3>
                <Link href={`/jlpt/${level}`}>{level.toUpperCase()} study notebook →</Link>
              </h3>
              <p>
                {coverage.coverage[level].vocabulary} vocabulary entries ·{" "}
                {coverage.coverage[level].grammar} grammar points ·{" "}
                {coverage.coverage[level].readings} original reading exercise
              </p>
              <nav className={styles.nav} aria-label={`${level.toUpperCase()} skills`}>
                {skills.map((s) => (
                  <Link href={`/jlpt/${level}/${s}`} key={s}>
                    {skillLabels[s]}
                    {s === "choukai" ? " · Held" : ""}
                  </Link>
                ))}
              </nav>
              <Link href={`/set/jlpt-${level}`}>Canonical kanji notebook →</Link>
            </article>
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
