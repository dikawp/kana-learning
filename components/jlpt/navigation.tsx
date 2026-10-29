import Link from "next/link"
import { levels, skills, skillLabels, type Level, type Skill } from "@/lib/jlpt/types"
import styles from "./jlpt.module.css"

export function LevelNav({ level }: { level?: Level }) {
  return (
    <nav className={styles.nav} aria-label="JLPT level">
      <Link href="/jlpt">JLPT map</Link>
      {levels.map((l) => (
        <Link key={l} href={`/jlpt/${l}`} aria-current={level === l ? "page" : undefined}>
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  )
}
export function SkillNav({ level, skill }: { level: Level; skill?: Skill }) {
  return (
    <nav className={styles.nav} aria-label="JLPT learning area">
      {skills.map((s) => (
        <Link key={s} href={`/jlpt/${level}/${s}`} aria-current={s === skill ? "page" : undefined}>
          {skillLabels[s]}
          {s === "choukai" ? " · Held" : ""}
        </Link>
      ))}
      <Link href={`/jlpt/${level}/practice`}>Practice</Link>
      <Link href={`/jlpt/${level}/review`}>Review</Link>
      <Link href={`/jlpt/${level}/mock`}>Exam blueprint</Link>
    </nav>
  )
}
export function CoverageNote() {
  return (
    <p className={styles.notice}>
      Vocabulary and grammar use the pinned OpenJLPT corpus across N5–N1. Community level mappings
      are not an official syllabus. Original reading exercises are separately labelled. Listening,
      audio and full mock exams are held.{" "}
      <Link href="/sources#jlpt-materials">Content sources and limitations →</Link>
    </p>
  )
}
