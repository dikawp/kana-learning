import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeading } from "@/components/platform/catalog"
import { LevelNav, SkillNav } from "@/components/jlpt/navigation"
import { blueprints } from "@/lib/jlpt/content"
import { isLevel } from "@/lib/jlpt/types"
import styles from "@/components/jlpt/jlpt.module.css"
export default async function MockPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params
  if (!isLevel(level)) notFound()
  const blueprint = blueprints.find((b) => b.level === level)!
  return (
    <>
      <LevelNav level={level} />
      <PageHeading
        eyebrow={`JLPT / ${level.toUpperCase()} / EXAM BLUEPRINT`}
        title={`${level.toUpperCase()} exam structure.`}
      />
      <SkillNav level={level} />
      <section className={styles.card}>
        <h2>Full mock exams are held</h2>
        <p>
          A full simulation requires listening. Listening is outside this release, so no full mock
          runtime, scaled score or pass prediction is available. The source-based text drills are
          learning practice.
        </p>
        <Link href={`/jlpt/${level}/practice`}>Continue with text practice →</Link>
      </section>
      <section>
        <h2>Official section timing</h2>
        <table>
          <caption>{level.toUpperCase()} JLPT section blueprint</caption>
          <thead>
            <tr>
              <th scope="col">Test section</th>
              <th scope="col">Minutes</th>
            </tr>
          </thead>
          <tbody>
            {blueprint.sessions.map((s) => (
              <tr key={s.label}>
                <td>{s.label}</td>
                <td>{s.minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Verified {blueprint.verifiedAt}.{" "}
          <a href={blueprint.sourceUrl}>Official JLPT test sections and timing →</a>
        </p>
        <p>
          Listening duration may vary. The official exam uses scaled scores; a percentage from these
          exercises cannot be converted into an official score.
        </p>
      </section>
    </>
  )
}
