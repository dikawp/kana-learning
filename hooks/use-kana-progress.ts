"use client"

import { useState, useSyncExternalStore } from "react"
import { kanaData } from "@/lib/kana-data"
import { guestStore } from "@/lib/progress/guest-store"

export function useKanaProgress(store = guestStore) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  const learnedCharacters = new Set(snapshot.learnedIds)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const percent = (type?: "hiragana" | "katakana") => {
    const pool = kanaData.filter((kana) => !type || kana.type === type)
    return pool.length ? Math.round(pool.filter((kana) => learnedCharacters.has(kana.id)).length / pool.length * 100) : 0
  }
  return {
    progress: { overall: percent(), hiragana: percent("hiragana"), katakana: percent("katakana"), learnedCharacters },
    storageStatus: snapshot.message,
    score,
    markAsLearned: store.mark,
    resetProgress: () => { store.reset(); setScore({ correct: 0, total: 0 }) },
    resetHiraganaProgress: () => store.reset("hiragana"),
    resetKatakanaProgress: () => store.reset("katakana"),
    updateScore: (correct: number, total: number) => setScore({ correct, total }),
    isLearned: (id: string) => learnedCharacters.has(id),
  }
}
