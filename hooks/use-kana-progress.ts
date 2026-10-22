"use client"
import { useSyncExternalStore } from "react"
import type { KanaCharacter } from "@/types/kana"
import type { createFamiliarityStore } from "@/lib/study/familiarity-store"

export function useKanaProgress(store: ReturnType<typeof createFamiliarityStore>, content: KanaCharacter[]) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  const learnedCharacters = new Set(snapshot.learnedIds)
  const percent = (type?: "hiragana" | "katakana") => {
    const pool = content.filter((kana) => !type || kana.type === type)
    return pool.length ? Math.round(pool.filter((kana) => learnedCharacters.has(kana.id)).length / pool.length * 100) : 0
  }
  return {
    progress: { overall: percent(), hiragana: percent("hiragana"), katakana: percent("katakana"), learnedCharacters },
    storageStatus: snapshot.message,
    markAsLearned: store.mark,
    resetProgress: () => store.reset(),
    resetHiraganaProgress: () => store.reset("hiragana"),
    resetKatakanaProgress: () => store.reset("katakana"),
    isLearned: (id: string) => learnedCharacters.has(id),
  }
}
