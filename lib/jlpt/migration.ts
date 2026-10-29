import aliases from "@/content/jlpt/generated/aliases.json"
import type { JlptProgress } from "./learning"
import type { Level, TextSkill } from "./types"
export const isRetiredPilot = (id: string) =>
  aliases.some((alias) => alias.id === id && alias.targetId === null)
/** Keep immutable attempts. Replacement lessons start as studying, never as mastered. */
export function upgradeResourceProgress(progress: JlptProgress): JlptProgress {
  let next = progress
  for (const alias of aliases) {
    if (!alias.targetId || !alias.targetLevel || !alias.targetSkill) continue
    const previous = progress.materials[alias.id]
    const entries = Object.entries(next.review).filter(([, r]) => r.materialId === alias.id)
    if ((previous && !next.materials[alias.targetId]) || entries.length) {
      if (next === progress)
        next = { ...progress, materials: { ...progress.materials }, review: { ...progress.review } }
      if (previous && !next.materials[alias.targetId])
        next.materials[alias.targetId] = { status: "studying", updatedAt: previous.updatedAt }
      for (const [key, r] of entries) {
        const targetKey = `${alias.targetId}-sense-1`
        if (!next.review[targetKey])
          next.review[targetKey] = {
            ...r,
            level: alias.targetLevel as Level,
            skill: alias.targetSkill as TextSkill,
            materialId: alias.targetId,
            streak: 0,
          }
        delete next.review[key]
      }
    }
  }
  return next
}
