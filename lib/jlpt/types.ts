export const levels = ["n5", "n4", "n3", "n2", "n1"] as const
export type Level = (typeof levels)[number]
export const skills = ["moji-goi", "bunpou", "dokkai", "choukai"] as const
export type Skill = (typeof skills)[number]
export type TextSkill = Exclude<Skill, "choukai">
export const skillLabels: Record<Skill, string> = {
  "moji-goi": "Moji & Goi",
  bunpou: "Bunpou",
  dokkai: "Dokkai",
  choukai: "Choukai",
}
export type Source = {
  id: string
  title: string
  url: string
  license: string
  attribution: string
  revision: string
  usage: "original" | "reference" | "adapted"
}
export type JapaneseBlock = { id: string; text: string; reading?: string }
export type Example = {
  japanese: string
  reading: string
  translation: string
  furigana?: string
  sourceUrl?: string
  sourceId?: string
}
export type MaterialSummary = {
  id: string
  version: number
  level: Level
  skill: TextSkill
  kind: "vocabulary" | "grammar" | "reading"
  title: string
  meaning: string
  objective: string
  tags: string[]
  sourceIds: string[]
  editorialStatus: "unreviewed" | "machine-checked" | "human-reviewed"
  origin: "ai-assisted" | "human-authored" | "adapted"
  levelBasis: string
  reading?: string
  romaji?: string
  textType?: string
  characterCount?: number
}
export type ProgressMaterial = Pick<MaterialSummary, "id" | "level" | "skill">
export type Material = MaterialSummary & {
  reading?: string
  partOfSpeech?: string
  forms?: string[]
  formation?: string
  explanation: string
  register?: string
  cautions?: string[]
  examples: Example[]
  blocks?: JapaneseBlock[]
  translation?: string
  textType?: string
  kanjiIds: string[]
  relatedIds: string[]
  comparisons?: { materialId: string; explanation: string }[]
  provenance?: {
    dataset: string
    entryId: string
    revision: string
    url: string
    jmdictId?: number
    license: string
  }
}
export type Question = {
  id: string
  version: number
  level: Level
  skill: TextSkill
  type:
    | "reading"
    | "orthography"
    | "context"
    | "paraphrase"
    | "usage"
    | "word-formation"
    | "grammar-form"
    | "sentence-composition"
    | "text-grammar"
    | "short-reading"
    | "information-retrieval"
    | "word-meaning"
    | "grammar-meaning"
    | "example-translation"
  materialId: string
  conceptId: string
  variantGroup: string
  prompt: string
  options: { id: string; label: string }[]
  answerId: string
  explanation: string
  distractors: Record<string, string>
  evidence?: { blockId: string; quote: string }
  context?: { title: string; blocks: JapaneseBlock[]; translation?: string }
  sourceIds: string[]
  method?: "source-derived" | "ai-assisted"
  sourceRevision?: string
}
export type Unit = {
  id: string
  level: Level
  title: string
  objective: string
  materialIds: string[]
  prerequisites: string[]
}
export type ExamBlueprint = {
  level: Level
  sessions: { label: string; minutes: number }[]
  verifiedAt: string
  sourceUrl: string
}
export const isLevel = (value: string): value is Level => levels.includes(value as Level)
export const isSkill = (value: string): value is Skill => skills.includes(value as Skill)
export const materialHref = (m: Pick<MaterialSummary, "id" | "level" | "skill">) =>
  `/jlpt/${m.level}/${m.skill}/${m.id}`
