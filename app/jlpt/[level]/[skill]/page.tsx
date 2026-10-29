import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeading, DeckTile, CardGrid } from "@/components/platform/catalog"
import { LevelNav, SkillNav, CoverageNote } from "@/components/jlpt/navigation"
import { MaterialDirectory } from "@/components/jlpt/directory"
import { getSummaries, getSources } from "@/lib/jlpt/repository"
import { catalog } from "@/lib/platform/repository"
import { isLevel, isSkill, skillLabels, skills } from "@/lib/jlpt/types"
import styles from "@/components/jlpt/jlpt.module.css"
type Query = Record<string, string | string[] | undefined>
export const dynamicParams = false
export function generateStaticParams() {
  return skills.map((skill) => ({ skill }))
}
const value = (q: Query, name: string) => (typeof q[name] === "string" ? (q[name] as string) : "")
export default async function SkillPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string; skill: string }>
  searchParams: Promise<Query>
}) {
  const { level, skill } = await params
  if (!isLevel(level) || !isSkill(skill)) notFound()
  const query = await searchParams
  if (skill === "choukai")
    return (
      <>
        <LevelNav level={level} />
        <PageHeading
          eyebrow={`JLPT / ${level.toUpperCase()} / CHOUKAI`}
          title="Listening is held."
        />
        <SkillNav level={level} skill={skill} />
        <section className={styles.card}>
          <h2>Listening materials are not available</h2>
          <p>
            Audio production, licensing, transcripts and listening exercises are outside this
            release. No listening result or full exam readiness is calculated.
          </p>
          <p>Continue with vocabulary, grammar or reading practice while this area is held.</p>
          <Link href={`/jlpt/${level}/practice`}>Open text practice →</Link>
        </section>
      </>
    )
  const materials = getSummaries(level, skill)
  const sources = getSources([...new Set(materials.flatMap((m) => m.sourceIds))])
  const kanji = skill === "moji-goi" && value(query, "tab") === "kanji"
  const cards = kanji
    ? catalog.cards.filter((c) => c.kind === "kanji" && c.jlpt === Number(level.slice(1)))
    : []
  const decks = kanji ? catalog.decks.filter((d) => d.set === `jlpt-${level}`) : []
  return (
    <>
      <LevelNav level={level} />
      <PageHeading
        eyebrow={`JLPT / ${level.toUpperCase()} / ${skill.toUpperCase()}`}
        title={`${skillLabels[skill]} notebook.`}
      />
      <SkillNav level={level} skill={skill} />
      <CoverageNote />
      {skill === "moji-goi" && (
        <nav className={styles.nav} aria-label="Moji and Goi view">
          <Link aria-current={!kanji ? "page" : undefined} href={`/jlpt/${level}/${skill}`}>
            Vocabulary materials
          </Link>
          <Link
            aria-current={kanji ? "page" : undefined}
            href={`/jlpt/${level}/${skill}?tab=kanji`}
          >
            Kanji cards and decks
          </Link>
        </nav>
      )}
      {kanji ? (
        <>
          <p>
            Approximate source labels. These are the same canonical kanji cards and saved ratings
            used throughout the collection.
          </p>
          <div className="deck-grid">
            {decks.map((d) => (
              <DeckTile key={d.slug} deck={d} cards={cards} />
            ))}
          </div>
          <h2>All {level.toUpperCase()} kanji cards</h2>
          <CardGrid cards={cards} />
        </>
      ) : (
        <MaterialDirectory
          key={[
            value(query, "q"),
            value(query, "tag"),
            value(query, "source"),
            value(query, "status"),
            value(query, "textType"),
            value(query, "length"),
          ].join(":")}
          level={level}
          skill={skill}
          materials={materials.map(
            ({
              id,
              level,
              skill,
              kind,
              title,
              meaning,
              reading,
              romaji,
              tags,
              sourceIds,
              editorialStatus,
              textType,
              characterCount,
            }) => ({
              id,
              level,
              skill,
              kind,
              title,
              meaning,
              reading,
              romaji,
              tags,
              sourceIds,
              editorialStatus,
              textType,
              characterCount,
            }),
          )}
          sources={sources}
          query={{
            q: value(query, "q"),
            tag: value(query, "tag"),
            source: value(query, "source"),
            status: value(query, "status"),
            textType: value(query, "textType"),
            length: value(query, "length"),
          }}
        />
      )}
    </>
  )
}
