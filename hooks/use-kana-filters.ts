"use client"

import { useState } from "react"
import { filterKana } from "@/lib/kana/search"
import type { KanaCharacter } from "@/types/kana"

export function useKanaFilters(kanaData: KanaCharacter[]) {
  const [selectedType, setSelectedType] = useState<"all" | "hiragana" | "katakana">("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  return {
    selectedType, setSelectedType, selectedCategory, setSelectedCategory, searchTerm, setSearchTerm,
    filteredKana: filterKana(kanaData, selectedType, selectedCategory, searchTerm),
    categories: ["basic", "dakuten", "handakuten", "combination"],
  }
}
