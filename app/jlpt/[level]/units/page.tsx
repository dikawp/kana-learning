import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeading } from "@/components/platform/catalog"
import { LevelNav, SkillNav } from "@/components/jlpt/navigation"
import { getUnits } from "@/lib/jlpt/repository"
import { isLevel } from "@/lib/jlpt/types"
import styles from "@/components/jlpt/jlpt.module.css"
export default async function UnitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { level } = await params
  if (!isLevel(level)) notFound()
  const raw = Number((await searchParams).page ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw : 1
  const units = getUnits(level),
    last = Math.max(1, Math.ceil(units.length / 20))
  if (page > last) notFound()
  return (
    <>
      <LevelNav level={level} />
      <PageHeading eyebrow={`JLPT / ${level.toUpperCase()}`} title="Choose a study set.">
        Every source-backed vocabulary and grammar entry is available. Study-set order is optional.
      </PageHeading>
      <SkillNav level={level} />
      <p>
        {units.length} study sets · page {page} of {last}
      </p>
      <div className={styles.grid}>
        {units.slice((page - 1) * 20, page * 20).map((u) => (
          <article className={styles.card} key={u.id}>
            <h2>
              <Link href={`/jlpt/${level}/units/${u.id}`}>{u.title}</Link>
            </h2>
            <p>{u.objective}</p>
            <p>{u.materialIds.length} materials</p>
          </article>
        ))}
      </div>
      <nav className={styles.nav} aria-label="Study set pages">
        {page > 1 && <Link href={`?page=${page - 1}`}>Previous page</Link>}
        {page < last && <Link href={`?page=${page + 1}`}>Next page</Link>}
      </nav>
    </>
  )
}
