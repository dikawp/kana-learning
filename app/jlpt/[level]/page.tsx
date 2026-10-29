import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeading } from "@/components/platform/catalog"
import { LevelNav, SkillNav, CoverageNote } from "@/components/jlpt/navigation"
import { LevelProgress } from "@/components/jlpt/progress"
import { getSummaries, getUnits } from "@/lib/jlpt/repository"
import { isLevel, skills, skillLabels } from "@/lib/jlpt/types"
import styles from "@/components/jlpt/jlpt.module.css"
export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params
  if (!isLevel(level)) notFound()
  const materials = getSummaries(level)
  const units = getUnits(level)
  return (
    <>
      <LevelNav level={level} />
      <PageHeading
        eyebrow={`JLPT / ${level.toUpperCase()}`}
        title={`${level.toUpperCase()} study notebook.`}
      >
        Suggested units connect vocabulary, grammar and reading. You can open any step without a
        prerequisite lock.
      </PageHeading>
      <CoverageNote />
      <SkillNav level={level} />
      <LevelProgress
        level={level}
        materials={materials.map(({ id, level, skill }) => ({ id, level, skill }))}
      />
      <section className={styles.card}>
        <h2>A short session for today</h2>
        <p>
          Study one unit step, then practise up to 10 text questions. Revisit explanations after
          each answer.
        </p>
        <div className={styles.nav}>
          <Link href={`/jlpt/${level}/practice`}>Start text practice →</Link>
          <Link href={`/jlpt/${level}/review`}>Review your concepts →</Link>
          <Link href={`/jlpt/${level}/mock`}>Official exam blueprint →</Link>
        </div>
      </section>
      <section>
        <h2>Learning units</h2>
        <div className={styles.grid}>
          {units.slice(0, 9).map((u) => (
            <article className={styles.card} key={u.id}>
              <h3>
                <Link href={`/jlpt/${level}/units/${u.id}`}>{u.title} →</Link>
              </h3>
              <p lang="en">{u.objective}</p>
              <p>{u.materialIds.length} steps · freely accessible</p>
              {u.prerequisites.length > 0 && (
                <p className={styles.muted}>Suggested preparation: {u.prerequisites.join(", ")}</p>
              )}
            </article>
          ))}
        </div>
        <Link href={`/jlpt/${level}/units`}>Browse all {units.length} study sets →</Link>
      </section>
      <section>
        <h2>Explore by skill</h2>
        <div className={styles.grid}>
          {skills.map((s) => (
            <article className={styles.card} key={s}>
              <h3>
                <Link href={`/jlpt/${level}/${s}`}>{skillLabels[s]} →</Link>
              </h3>
              <p>
                {s === "choukai"
                  ? "Listening is held; no audio or listening exercises are available."
                  : `${materials.filter((m) => m.skill === s).length} materials with text practice.`}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
