import type { KanaCharacter, QuizSetup } from "../../types/kana"
import { generateQuizQuestions } from "../kana/quiz"
import { MAX_HISTORY, MAX_STUDY_CHARS, studySchema, type StudyState } from "./contracts"

export const STUDY_KEY = "kana-learning:study:v1"
type StorageAccess = Pick<Storage, "getItem" | "setItem">
type Snapshot = { data: StudyState; status: "loading" | "saved" | "memory"; message: string }
const empty = (): StudyState => ({ version: 1, active: null, history: [] })
const initial: Snapshot = { data: empty(), status: "loading", message: "Loading local quizzes…" }

export function parseStudy(raw: string | null, content: KanaCharacter[]): StudyState {
  if (raw === null) return empty()
  if (raw.length > MAX_STUDY_CHARS) throw Error("Study record too large")
  const data = studySchema.parse(JSON.parse(raw))
  const known = new Map(content.map((entry) => [entry.id, entry]))
  for (const session of [...data.history, ...(data.active ? [data.active] : [])]) {
    // Reading/answer revisions are snapshots; never regrade history with new readings.
    if (session.questions.some((q) => known.get(q.character.id)?.character !== q.character.character)) throw Error("Unknown quiz material")
  }
  return data
}

export function createStudyStore(content: KanaCharacter[], storage: () => StorageAccess = () => window.localStorage) {
  let snapshot = initial
  let initialized = false
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  const read = (raw: string | null) => {
    try { snapshot = { data: parseStudy(raw, content), status: "saved", message: "Quizzes are stored on this device only." } }
    catch { snapshot = { data: empty(), status: "memory", message: "Saved quizzes are invalid. Practice works in memory; the next quiz change starts a new local record." } }
  }
  const initialize = () => {
    if (initialized) return
    initialized = true
    try { read(storage().getItem(STUDY_KEY)) }
    catch { snapshot = { data: empty(), status: "memory", message: "Quiz storage is unavailable. Practice works in memory for this page." } }
  }
  const save = (data: StudyState) => {
    const raw = JSON.stringify(studySchema.parse(data))
    snapshot = { data, status: "saved", message: "Quizzes are stored on this device only." }
    try {
      if (raw.length > MAX_STUDY_CHARS) throw Error("Study record too large")
      storage().setItem(STUDY_KEY, raw)
    } catch { snapshot = { data, status: "memory", message: "Quiz changes could not be saved. They last only for this open page." } }
    emit()
  }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener)
      if (!initialized) initialize()
      const changed = (event: StorageEvent) => {
        try {
          if ((event.key === STUDY_KEY || event.key === null) && event.storageArea === window.localStorage) { read(event.newValue); emit() }
        } catch { /* A denied storage getter must not break memory-only practice. */ }
      }
      window.addEventListener("storage", changed)
      return () => { listeners.delete(listener); window.removeEventListener("storage", changed) }
    },
    start(setup: QuizSetup, revision: string) {
      initialize()
      if (snapshot.data.active) return false
      const questions = generateQuizQuestions(content, setup)
      if (!questions.length) return false
      save({ ...snapshot.data, active: { id: crypto.randomUUID(), setup, contentRevision: revision, questions, answers: [], position: 0, createdAt: new Date().toISOString(), completedAt: null } })
      return true
    },
    answer(id: string, position: number, answer: string) {
      initialize()
      const session = snapshot.data.active
      if (!session || session.id !== id || session.position !== position || session.answers.length !== position || !session.questions[position]?.options.includes(answer)) return false
      save({ ...snapshot.data, active: { ...session, answers: [...session.answers, answer] } })
      return true
    },
    advance(id: string, position: number) {
      initialize()
      const s = snapshot.data.active
      if (!s || s.id !== id || s.position !== position || s.answers.length !== position + 1) return null
      if (position === s.questions.length - 1) {
        const finished = { ...s, completedAt: new Date(Math.max(Date.now(), Date.parse(s.createdAt))).toISOString() }
        save({ version: 1, active: null, history: [finished, ...snapshot.data.history].slice(0, MAX_HISTORY) })
        return finished
      }
      save({ ...snapshot.data, active: { ...s, position: position + 1 } })
      return null
    },
    cancel() { initialize(); if (snapshot.data.active) save({ ...snapshot.data, active: null }) },
    clearHistory() { initialize(); save({ ...snapshot.data, history: [] }) },
  }
}
export type StudyStore = ReturnType<typeof createStudyStore>
