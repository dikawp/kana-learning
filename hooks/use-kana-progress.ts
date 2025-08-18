"use client"

import { useState, useEffect } from "react"

export function useKanaProgress() {
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [score, setScore] = useState({ correct: 0, total: 0 })

  useEffect(() => {
    const savedProgress = localStorage.getItem("kana-progress")
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("kana-progress", JSON.stringify(progress))
  }, [progress])

  const markAsLearned = (kanaId: string) => {
    setProgress((prev) => ({
      ...prev,
      [kanaId]: true,
    }))
  }

  const resetProgress = () => {
    setProgress({})
    setScore({ correct: 0, total: 0 })
  }

  const updateScore = (correct: number, total: number) => {
    setScore((prev) => ({
      correct: prev.correct + correct,
      total: prev.total + total,
    }))
  }

  return {
    progress,
    score,
    markAsLearned,
    resetProgress,
    updateScore,
  }
}
