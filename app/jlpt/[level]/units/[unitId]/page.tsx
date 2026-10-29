import { notFound } from "next/navigation"
import { PageHeading } from "@/components/platform/catalog"
import { LevelNav, SkillNav } from "@/components/jlpt/navigation"
import { UnitSteps } from "@/components/jlpt/progress"
import { getSummaries, getUnits } from "@/lib/jlpt/repository"
import { isLevel } from "@/lib/jlpt/types"
export const dynamicParams = false
export function generateStaticParams({ params }: { params: { level: string } }) {
  if (!isLevel(params.level)) return []
  return getUnits(params.level).map((u) => ({ unitId: u.id }))
}
export default async function UnitPage({
  params,
}: {
  params: Promise<{ level: string; unitId: string }>
}) {
  const { level, unitId } = await params
  if (!isLevel(level)) notFound()
  const unit = getUnits(level).find((u) => u.id === unitId)
  if (!unit) notFound()
  const summaries = getSummaries(level)
  const materials = unit.materialIds.flatMap((id) => {
    const m = summaries.find((s) => s.id === id)
    return m ? [m] : []
  })
  return (
    <>
      <LevelNav level={level} />
      <PageHeading eyebrow={`JLPT / ${level.toUpperCase()} / UNIT`} title={unit.title} />
      <SkillNav level={level} />
      <UnitSteps unit={unit} materials={materials} />
    </>
  )
}
