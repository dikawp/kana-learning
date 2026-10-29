import type { ExamBlueprint, Source, Unit } from "./types"
import unitData from "@/content/jlpt/generated/units.json"
import manifest from "@/content/jlpt/upstream/openjlpt/manifest.json"

export const sources: Source[] = [
  {
    id: "jlpt-original-en-v2",
    title: "KanaLearn original reading exercises (AI-assisted)",
    url: "/licenses/jlpt-original.txt",
    license: "MIT (original project contributions only; see project LICENSE)",
    attribution:
      "KanaLearn. Original AI-assisted Japanese passages; English translations and explanations. Not human-reviewed.",
    revision: "2026-10-28.original-reading.en.v2",
    usage: "original",
  },
  {
    id: "openjlpt-vocabulary",
    title: "OpenJLPT vocabulary corpus",
    url: `https://github.com/evanclan/OpenJLPT/tree/${manifest.revision}/data/json/vocab`,
    license: "CC-BY-SA-4.0",
    attribution:
      "OpenJLPT contributors; Jonathan Waller; EDRDG (JMdict); Tatoeba contributors. See the bundled OpenJLPT notice.",
    revision: manifest.revision,
    usage: "adapted",
  },
  {
    id: "openjlpt-grammar",
    title: "OpenJLPT grammar corpus",
    url: `https://github.com/evanclan/OpenJLPT/tree/${manifest.revision}/data/json/grammar`,
    license: "CC-BY-SA-4.0",
    attribution:
      "Original grammar explanations, formation and examples by OpenJLPT contributors. Not independently language-reviewed by KanaLearn.",
    revision: manifest.revision,
    usage: "adapted",
  },
  {
    id: "edrdg-jmdict",
    title: "JMdict — EDRDG",
    url: "https://www.edrdg.org/jmdict/j_jmdict.html",
    license: "CC-BY-SA-4.0",
    attribution:
      "James William Breen and the Electronic Dictionary Research and Development Group. Entry IDs and part-of-speech enrichment via the pinned OpenJLPT snapshot.",
    revision: "JMdict 2026-09-29, via OpenJLPT " + manifest.revision,
    usage: "adapted",
  },
  {
    id: "waller-jlpt",
    title: "Jonathan Waller's community JLPT lists",
    url: "https://www.tanos.co.uk/jlpt/",
    license: "CC BY; combined derivative distributed as CC-BY-SA-4.0",
    attribution:
      "Jonathan Waller (tanos.co.uk). Level assignments and short English glosses via OpenJLPT; not an official JLPT syllabus.",
    revision: manifest.revision,
    usage: "adapted",
  },
  {
    id: "tatoeba-text",
    title: "Tatoeba sentence pairs",
    url: "https://tatoeba.org/en/downloads",
    license: "CC-BY-2.0-FR; combined derivative distributed as CC-BY-SA-4.0",
    attribution:
      "Tatoeba contributors. Sentence IDs and attribution links are retained on each imported example; no audio is included.",
    revision: manifest.revision,
    usage: "adapted",
  },
]

export const units = unitData as Unit[]
const sourceUrl = "https://www.jlpt.jp/e/guideline/testsections.html"
export const blueprints: ExamBlueprint[] = [
  {
    level: "n5",
    sessions: [
      { label: "Language Knowledge (Vocabulary)", minutes: 20 },
      { label: "Language Knowledge (Grammar) / Reading", minutes: 40 },
      { label: "Listening", minutes: 30 },
    ],
    verifiedAt: "2026-10-28",
    sourceUrl,
  },
  {
    level: "n4",
    sessions: [
      { label: "Language Knowledge (Vocabulary)", minutes: 25 },
      { label: "Language Knowledge (Grammar) / Reading", minutes: 55 },
      { label: "Listening", minutes: 35 },
    ],
    verifiedAt: "2026-10-28",
    sourceUrl,
  },
  {
    level: "n3",
    sessions: [
      { label: "Language Knowledge (Vocabulary)", minutes: 30 },
      { label: "Language Knowledge (Grammar) / Reading", minutes: 70 },
      { label: "Listening", minutes: 40 },
    ],
    verifiedAt: "2026-10-28",
    sourceUrl,
  },
  {
    level: "n2",
    sessions: [
      { label: "Language Knowledge (Vocabulary/Grammar) / Reading", minutes: 105 },
      { label: "Listening", minutes: 50 },
    ],
    verifiedAt: "2026-10-28",
    sourceUrl,
  },
  {
    level: "n1",
    sessions: [
      { label: "Language Knowledge (Vocabulary/Grammar) / Reading", minutes: 110 },
      { label: "Listening", minutes: 55 },
    ],
    verifiedAt: "2026-10-28",
    sourceUrl,
  },
]
