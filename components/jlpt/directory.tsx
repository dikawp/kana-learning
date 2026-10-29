"use client"
import Link from "next/link"
import { useState } from "react"
import { useSave } from "@/lib/platform/store"
import { useJlpt } from "@/lib/jlpt/store"
import {
  materialHref,
  type Level,
  type Skill,
  type MaterialSummary,
  type Source,
} from "@/lib/jlpt/types"
import styles from "./jlpt.module.css"
export type DirectoryMaterial = Pick<
  MaterialSummary,
  | "id"
  | "level"
  | "skill"
  | "kind"
  | "title"
  | "meaning"
  | "reading"
  | "romaji"
  | "tags"
  | "sourceIds"
  | "editorialStatus"
  | "textType"
  | "characterCount"
>

export function MaterialDirectory({
  level,
  skill,
  materials,
  sources,
  query,
}: {
  level: Level
  skill: Skill
  materials: DirectoryMaterial[]
  sources: Source[]
  query: {
    q: string
    tag: string
    source: string
    status: string
    textType?: string
    length?: string
  }
}) {
  const [page, setPage] = useState(1)
  const { slot } = useSave()
  const { data } = useJlpt(slot?.id ?? null)
  const filtered = materials.filter(
    (m) =>
      (!query.q ||
        `${m.title} ${m.reading ?? ""} ${m.romaji ?? ""} ${m.meaning} ${m.tags.join(" ")}`
          .normalize("NFKC")
          .toLocaleLowerCase()
          .includes(query.q.normalize("NFKC").trim().toLocaleLowerCase())) &&
      (!query.tag || m.tags.includes(query.tag)) &&
      (!query.source || m.sourceIds.includes(query.source)) &&
      (!query.status || (data?.materials[m.id]?.status ?? "not-started") === query.status) &&
      (!query.textType || m.textType === query.textType) &&
      (!query.length ||
        (query.length === "short"
          ? (m.characterCount ?? 0) <= 200
          : (m.characterCount ?? 0) > 200)),
  )
  const tags = [...new Set(materials.flatMap((m) => m.tags))]
  return (
    <div className={styles.stack}>
      <form className={styles.filters} action={`/jlpt/${level}/${skill}`}>
        <label>
          Search materials
          <input name="q" type="search" defaultValue={query.q} placeholder="Japanese or English" />
        </label>
        <label>
          Tag
          <select name="tag" defaultValue={query.tag}>
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select name="source" defaultValue={query.source}>
            <option value="">All sources</option>
            {sources.map((s) => (
              <option value={s.id} key={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Study status
          <select name="status" defaultValue={query.status}>
            <option value="">All statuses</option>
            <option value="not-started">Not started</option>
            <option value="studying">Studying</option>
            <option value="studied">Studied</option>
          </select>
        </label>
        {skill === "dokkai" && (
          <>
            <label>
              Text type
              <select name="textType" defaultValue={query.textType ?? ""}>
                <option value="">All types</option>
                {[...new Set(materials.flatMap((m) => (m.textType ? [m.textType] : [])))].map(
                  (type) => (
                    <option key={type}>{type}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Length (Japanese characters)
              <select name="length" defaultValue={query.length ?? ""}>
                <option value="">All lengths</option>
                <option value="short">Up to 200</option>
                <option value="long">More than 200</option>
              </select>
            </label>
          </>
        )}
        <button className={styles.button} type="submit">
          Apply filters
        </button>
        <Link href={`/jlpt/${level}/${skill}`}>Reset filters</Link>
      </form>
      <p role="status">
        {filtered.length} of {materials.length} materials · {level.toUpperCase()}
      </p>
      {!filtered.length ? (
        <p className="empty-state">
          No materials match these filters. Reset the filters to browse this level.
        </p>
      ) : (
        <div className={styles.grid}>
          {filtered.slice(0, page * 40).map((m) => (
            <article className={styles.card} key={m.id}>
              <span className="eyebrow">
                {m.kind.toUpperCase()} · {m.level.toUpperCase()}
              </span>
              <h2>
                <Link href={materialHref(m)} lang={m.kind === "reading" ? "en" : "ja"}>
                  {m.title}
                </Link>
              </h2>
              <p lang="en">{m.meaning}</p>
              {m.reading && (
                <p lang="ja">
                  {m.reading} {m.romaji && <span lang="en">· {m.romaji}</span>}
                </p>
              )}
              {m.characterCount !== undefined && (
                <p>
                  {m.textType} · {m.characterCount} Japanese characters
                </p>
              )}
              <div className={styles.tags}>
                {m.tags.map((t) => (
                  <span className={styles.tag} key={t}>
                    {t}
                  </span>
                ))}
                <span className={styles.tag}>{data?.materials[m.id]?.status ?? "Not started"}</span>
                <span className={styles.tag}>{m.editorialStatus}</span>
              </div>
              <p className={styles.muted}>
                {m.sourceIds.map((id) => sources.find((s) => s.id === id)?.title ?? id).join(" · ")}
              </p>
              <Link href={materialHref(m)}>Open lesson →</Link>
            </article>
          ))}
        </div>
      )}
      {filtered.length > page * 40 && (
        <button className={styles.button} onClick={() => setPage((p) => p + 1)}>
          Show more materials ({Math.min(page * 40, filtered.length)} of {filtered.length})
        </button>
      )}
    </div>
  )
}
