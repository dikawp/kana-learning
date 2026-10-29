import "server-only"
import fs from "node:fs"
import path from "node:path"
import { units, sources } from "./content"
import { sourceQuestions } from "./questions"
import type { Level, Material, MaterialSummary, Question, Skill, ProgressMaterial } from "./types"
const root = path.join(process.cwd(), "content/jlpt/generated"),
  cache = new Map<string, unknown>()
function read<T>(file: string): T {
  if (!cache.has(file)) cache.set(file, JSON.parse(fs.readFileSync(path.join(root, file), "utf8")))
  return cache.get(file) as T
}
export const getProgressIndex = () => read<ProgressMaterial[]>("progress-index.json")
export const getCoverage = () =>
  read<{
    materials: number
    vocabulary: number
    grammar: number
    readings: number
    units: number
    coverage: Record<
      Level,
      {
        vocabulary: number
        grammar: number
        readings: number
        vocabularyWithExamples: number
        vocabularyWithoutPartOfSpeech: number
      }
    >
  }>("coverage.json")
const materials = (level: Level) => read<Material[]>(`${level}/materials.json`)
export function getSummaries(level?: Level, skill?: Skill): MaterialSummary[] {
  return (level ? [level] : ["n5", "n4", "n3", "n2", "n1"])
    .flatMap((l) => read<MaterialSummary[]>(`${l}/summaries.json`))
    .filter((m) => !skill || m.skill === skill)
}
export function getMaterial(id: string): Material | undefined {
  const m = getProgressIndex().find((m) => m.id === id)
  return m ? materials(m.level).find((m) => m.id === id) : undefined
}
export function getLegacyMaterial(id: string) {
  return read<{ id: string; level: Level; skill: Skill; targetId: string | null }[]>(
    "aliases.json",
  ).find((a) => a.id === id)
}
export const getUnits = (level: Level) => units.filter((u) => u.level === level)
export function getPracticeMaterials(level: Level, batch = 0, skill?: Skill) {
  const summaries = getSummaries(level, skill)
  return (["moji-goi", "bunpou", "dokkai"] as const).flatMap((s) => {
    const own = summaries.filter((m) => m.skill === s)
    if (!own.length) return []
    const offset = (batch * 10) % own.length
    return [
      ...own.slice(offset, offset + 10),
      ...own.slice(0, Math.max(0, offset + 10 - own.length)),
    ]
      .slice(0, 10)
      .map((m) => m.id)
  })
}
export function getQuestions(level: Level, materialIds?: string[]): Question[] {
  const ids = materialIds ?? getPracticeMaterials(level)
  const original = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "content/jlpt/readings.json"), "utf8"),
  ) as { questions: Question[] }
  return [...new Set(ids)].flatMap((id) => {
    const m = getMaterial(getLegacyMaterial(id)?.targetId ?? id)
    if (!m || m.level !== level) return []
    return m.kind === "reading"
      ? original.questions.filter((q) => q.materialId === m.id)
      : sourceQuestions(
          m,
          materials(level).filter((o) => o.kind === m.kind),
        )
  })
}
export const getSources = (ids: string[]) => sources.filter((s) => ids.includes(s.id))
