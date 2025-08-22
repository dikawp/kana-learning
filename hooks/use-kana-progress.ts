"use client"

import { useState, useEffect } from "react"
import { kanaData } from "@/lib/kana-data"

interface DetailedProgress {
  overall: number
  hiragana: number
  katakana: number
  learnedCharacters: Set<string>
}

export function useKanaProgress() {
  const [learnedCharacters, setLearnedCharacters] = useState<Set<string>>(new Set())
  const [score, setScore] = useState({ correct: 0, total: 0 })

  useEffect(() => {
    const savedProgress = localStorage.getItem("kana-learned-characters")
    if (savedProgress) {
      setLearnedCharacters(new Set(JSON.parse(savedProgress)))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("kana-learned-characters", JSON.stringify(Array.from(learnedCharacters)))
  }, [learnedCharacters])

  const calculateProgress = (): DetailedProgress => {
    const totalCharacters = kanaData.length
    const hiraganaCharacters = kanaData.filter((char) => char.type === "hiragana")
    const katakanaCharacters = kanaData.filter((char) => char.type === "katakana")

    const learnedHiragana = hiraganaCharacters.filter((char) => learnedCharacters.has(char.id)).length
    const learnedKatakana = katakanaCharacters.filter((char) => learnedCharacters.has(char.id)).length

    return {
      overall: Math.round((learnedCharacters.size / totalCharacters) * 100),
      hiragana: Math.round((learnedHiragana / hiraganaCharacters.length) * 100),
      katakana: Math.round((learnedKatakana / katakanaCharacters.length) * 100),
      learnedCharacters,
    }
  }

  const markAsLearned = (kanaId: string) => {
    setLearnedCharacters((prev) => {
      if (!prev.has(kanaId)) {
        return new Set([...prev, kanaId])
      }
      return prev
    })
  }

  const resetProgress = () => {
    setLearnedCharacters(new Set())
    setScore({ correct: 0, total: 0 })
  }

  const resetHiraganaProgress = () => {
    const hiraganaIds = kanaData.filter((char) => char.type === "hiragana").map((char) => char.id)
    setLearnedCharacters((prev) => {
      const newSet = new Set(prev)
      hiraganaIds.forEach((id) => newSet.delete(id))
      return newSet
    })
  }

  const resetKatakanaProgress = () => {
    const katakanaIds = kanaData.filter((char) => char.type === "katakana").map((char) => char.id)
    setLearnedCharacters((prev) => {
      const newSet = new Set(prev)
      katakanaIds.forEach((id) => newSet.delete(id))
      return newSet
    })
  }

  const updateScore = (correct: number, total: number) => {
    setScore((prev) => ({
      correct: prev.correct + correct,
      total: prev.total + total,
    }))
  }

  const progress = calculateProgress()

  return {
    progress,
    score,
    markAsLearned,
    resetProgress,
    resetHiraganaProgress,
    resetKatakanaProgress,
    updateScore,
    isLearned: (kanaId: string) => learnedCharacters.has(kanaId),
  }
}
