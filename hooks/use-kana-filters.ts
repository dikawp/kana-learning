"use client"

import { useState } from "react"
import type { KanaCharacter } from "@/types/kana"

export function useKanaFilters(kanaData: KanaCharacter[]) {
  const [selectedType, setSelectedType] = useState<"all" | "hiragana" | "katakana">("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredKana = kanaData.filter((kana) => {
    const typeMatch = selectedType === "all" || kana.type === selectedType
    const categoryMatch = selectedCategory === "all" || kana.category === selectedCategory
    const searchMatch =
      searchTerm === "" ||
      kana.character.includes(searchTerm) ||
      kana.romanji.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kana.pronunciation.toLowerCase().includes(searchTerm.toLowerCase())

    return typeMatch && categoryMatch && searchMatch
  })

  const categories = [...new Set(kanaData.map((k) => k.category))]

  return {
    selectedType,
    setSelectedType,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    filteredKana,
    categories,
  }
}
