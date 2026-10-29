"use client"
import Link from "next/link"
import { useSave } from "@/lib/platform/store"
import { useJlpt } from "@/lib/jlpt/store"
import {
  materialHref,
  skillLabels,
  type MaterialSummary,
  type Level,
  type Unit,
  type ProgressMaterial,
} from "@/lib/jlpt/types"
import { progressSummary } from "@/lib/jlpt/learning"
import styles from "./jlpt.module.css"

export function LevelProgress({
  level,
  materials,
}: {
  level: Level
  materials: ProgressMaterial[]
}) {
  const { slot } = useSave()
  const { data, status, message } = useJlpt(slot?.id ?? null)
  if (!data) return <p role="status">Opening local JLPT progress…</p>
  const summary = progressSummary(data, materials)
  return (
    <section className={styles.card} aria-label="Your JLPT progress">
      <h2>Your {level.toUpperCase()} notebook</h2>
      {status === "memory" && (
        <p role="status" className="storage-warning">
          {message}
        </p>
      )}
      <div className={styles.summary}>
        <p>
          <strong>
            {summary.studied}/{materials.length}
          </strong>
          materials marked studied
        </p>
        <p>
          <strong>{summary.due}</strong>concepts due for review
        </p>
        <p>
          <strong>{summary.accuracy === null ? "—" : `${summary.accuracy}%`}</strong>
          {summary.answered
            ? `accuracy · ${summary.answered} completed-session answers`
            : "No completed-session answers yet"}
        </p>
      </div>
      <ul>
        {(["moji-goi", "bunpou", "dokkai"] as const).map((skill) => {
          const entries = materials.filter((m) => m.skill === skill)
          const summary = progressSummary(data, entries)
          return (
            <li key={skill}>
              <Link href={`/jlpt/${level}/${skill}`}>{skillLabels[skill]}</Link>: {summary.studied}/
              {summary.total} studied · {summary.due} due
            </li>
          )
        })}
      </ul>
      {data.active && (
        <p>
          <Link href={`/jlpt/${data.active.level}/${data.active.mode}`}>
            Resume {data.active.level.toUpperCase()} {data.active.mode} · question{" "}
            {data.active.index + 1}
          </Link>
        </p>
      )}
      {data.lastActivity?.level === level && (
        <p>
          <Link href={data.lastActivity.href}>Continue: {data.lastActivity.title} →</Link>
        </p>
      )}
      <p className={styles.muted}>
        These are local activity records; they do not measure exam readiness or mastery.
      </p>
    </section>
  )
}

export function JlptOverview({ materials }: { materials: ProgressMaterial[] }) {
  const { slot } = useSave()
  const { data, status, message } = useJlpt(slot?.id ?? null)
  if (!data) return <p role="status">Opening your JLPT notebook…</p>
  const summary = progressSummary(data, materials)
  return (
    <section className={styles.card}>
      <h2>Continue your learning</h2>
      {status === "memory" && (
        <p role="status" className="storage-warning">
          {message}
        </p>
      )}
      <p>
        {summary.studied}/{summary.total} materials studied · {summary.due} text concepts due across
        all levels
      </p>
      {data.active ? (
        <p>
          <Link className="primary-button" href={`/jlpt/${data.active.level}/${data.active.mode}`}>
            Resume {data.active.level.toUpperCase()} {data.active.mode} →
          </Link>
        </p>
      ) : data.lastActivity ? (
        <p>
          <Link className="primary-button" href={data.lastActivity.href}>
            Continue: {data.lastActivity.title} →
          </Link>
        </p>
      ) : (
        <p>
          <Link href="/jlpt/n5">Start with the N5 notebook →</Link>
        </p>
      )}
      <div className={styles.nav}>
        {(["n5", "n4", "n3", "n2", "n1"] as const).map((level) => {
          const due = progressSummary(
            data,
            materials.filter((m) => m.level === level),
          ).due
          return due > 0 ? (
            <Link key={level} href={`/jlpt/${level}/review`}>
              {level.toUpperCase()}: {due} due →
            </Link>
          ) : null
        })}
      </div>
    </section>
  )
}

export function UnitSteps({ unit, materials }: { unit: Unit; materials: MaterialSummary[] }) {
  const { slot } = useSave()
  const { data } = useJlpt(slot?.id ?? null)
  const next = materials.find((m) => data?.materials[m.id]?.status !== "studied")
  return (
    <div className={styles.stack}>
      <p lang="en">{unit.objective}</p>
      <p className={styles.muted}>Suggested order only. Every step is available now.</p>
      <Link
        className="primary-button"
        href={next ? materialHref(next) : `/jlpt/${unit.level}/practice?unit=${unit.id}`}
      >
        {next ? "Resume next study step" : "Practice this unit"} →
      </Link>
      <ol className={styles.steps}>
        {materials.map((m) => (
          <li key={m.id}>
            <Link href={materialHref(m)} lang={m.kind === "reading" ? "en" : "ja"}>
              {m.title}
            </Link>
            <p lang="en">{m.meaning}</p>
            <span className={styles.tag}>{data?.materials[m.id]?.status ?? "Not started"}</span>
          </li>
        ))}
      </ol>
      <Link href={`/jlpt/${unit.level}/practice?unit=${unit.id}`}>Practice unit questions →</Link>
    </div>
  )
}
