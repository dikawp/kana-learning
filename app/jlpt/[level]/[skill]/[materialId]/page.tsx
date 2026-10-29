import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { LevelNav, SkillNav } from "@/components/jlpt/navigation"
import { MaterialLesson } from "@/components/jlpt/material"
import { getMaterial, getSummaries, getSources, getLegacyMaterial } from "@/lib/jlpt/repository"
import { isLevel, isSkill, materialHref } from "@/lib/jlpt/types"
export const dynamicParams = true
export function generateStaticParams() {
  return []
}
export default async function MaterialPage({
  params,
}: {
  params: Promise<{ level: string; skill: string; materialId: string }>
}) {
  const { level, skill, materialId } = await params
  if (!isLevel(level) || !isSkill(skill) || skill === "choukai") notFound()
  const legacy = getLegacyMaterial(materialId)
  if (legacy) {
    if (legacy.level !== level || legacy.skill !== skill) notFound()
    const replacement = legacy.targetId ? getMaterial(legacy.targetId) : undefined
    if (replacement) permanentRedirect(materialHref(replacement))
    return (
      <>
        <LevelNav level={level} />
        <h1>This pilot entry has been retired.</h1>
        <p>
          The imported corpus does not contain a verified replacement for this entry. Your recorded
          answers and session snapshots are retained in your local save.
        </p>
        <Link href={`/jlpt/${level}/${skill}`}>Browse the source-backed catalog →</Link>
      </>
    )
  }
  const material = getMaterial(materialId)
  if (!material || material.level !== level || material.skill !== skill) notFound()
  const relatedIds = new Set([
    ...material.relatedIds,
    ...(material.comparisons?.map((c) => c.materialId) ?? []),
  ])
  const related = getSummaries().filter((m) => relatedIds.has(m.id))
  return (
    <>
      <LevelNav level={level} />
      <div className="page-heading">
        <p className="eyebrow">
          JLPT / {level.toUpperCase()} / {material.kind.toUpperCase()}
        </p>
        <h1 lang={material.kind === "reading" ? "en" : "ja"}>{material.title}</h1>
      </div>
      <SkillNav level={level} skill={skill} />
      <MaterialLesson
        key={material.id}
        material={material}
        sources={getSources(material.sourceIds)}
        related={related}
      />
    </>
  )
}
