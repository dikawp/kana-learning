import { notFound } from "next/navigation"
import { PageHeading } from "@/components/platform/catalog"
import { PracticeRoom } from "@/components/jlpt/practice"
import {
  getMaterial,
  getUnits,
  getQuestions,
  getPracticeMaterials,
  getLegacyMaterial,
} from "@/lib/jlpt/repository"
import Link from "next/link"
import { isLevel, isSkill } from "@/lib/jlpt/types"
type Query = Record<string, string | string[] | undefined>
export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>
  searchParams: Promise<Query>
}) {
  const { level } = await params
  if (!isLevel(level)) notFound()
  const query = await searchParams
  const requestedBatch = Number(query.batch ?? 0),
    batch =
      Number.isSafeInteger(requestedBatch) && requestedBatch >= 0 && requestedBatch < 1000
        ? requestedBatch
        : 0
  const skill = typeof query.skill === "string" ? query.skill : ""
  if (skill && (!isSkill(skill) || skill === "choukai")) notFound()
  let ids: string[] | undefined
  let filterLabel = `Source-based text practice · batch ${batch + 1}`
  if (typeof query.unit === "string") {
    const unit = getUnits(level).find((u) => u.id === query.unit)
    if (!unit) notFound()
    ids = unit.materialIds
    filterLabel = `Unit: ${unit.title}`
  }
  if (typeof query.material === "string") {
    const m = getMaterial(getLegacyMaterial(query.material)?.targetId ?? query.material)
    if (!m || m.level !== level) notFound()
    ids = [m.id]
    filterLabel = `Material: ${m.title}`
  }
  return (
    <>
      <PageHeading
        eyebrow={`JLPT / ${level.toUpperCase()} / TEXT PRACTICE`}
        title="Put your learning into practice."
      />
      <PracticeRoom
        key={`${level}:${filterLabel}:${skill}`}
        level={level}
        questions={getQuestions(level, ids ?? getPracticeMaterials(level, batch))}
        mode="practice"
        filterLabel={filterLabel}
        initialSkill={skill}
      />
      {!ids && (
        <p>
          <Link href={`/jlpt/${level}/practice?batch=${(batch + 1) % 1000}`}>
            Load a different source batch →
          </Link>
        </p>
      )}
    </>
  )
}
