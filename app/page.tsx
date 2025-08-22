"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { kanaData } from "@/lib/kana-data"
import { useKanaProgress } from "@/hooks/use-kana-progress"
import { useKanaFilters } from "@/hooks/use-kana-filters"
import { Header } from "@/components/layout/header"
import { ProgressCard } from "@/components/kana/progress-card"
import { FiltersCard } from "@/components/kana/filters-card"
import { FlashcardMode } from "@/components/kana/flashcard-mode"
import { QuizMode } from "@/components/kana/quiz-mode"
import { TableView } from "@/components/kana/table-view"

export default function KanaLearningApp() {
  const [mounted, setMounted] = useState(false)
  const [currentMode, setCurrentMode] = useState<"flashcard" | "quiz" | "table">("flashcard")

  const {
    progress,
    score,
    markAsLearned,
    resetProgress,
    resetHiraganaProgress,
    resetKatakanaProgress,
    updateScore,
    isLearned,
  } = useKanaProgress()

  const {
    selectedType,
    setSelectedType,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    filteredKana,
    categories,
  } = useKanaFilters(kanaData)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <ProgressCard
          progress={progress}
          score={score}
          onResetProgress={resetProgress}
          onResetHiraganaProgress={resetHiraganaProgress}
          onResetKatakanaProgress={resetKatakanaProgress}
        />

        <FiltersCard
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          filteredCount={filteredKana.length}
        />

        <Tabs value={currentMode} onValueChange={(value: any) => setCurrentMode(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flashcard">Flashcard Mode</TabsTrigger>
            <TabsTrigger value="quiz">Quiz Mode</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="flashcard" className="space-y-4">
            <FlashcardMode filteredKana={filteredKana} onMarkAsLearned={markAsLearned} isLearned={isLearned} />
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4">
            <QuizMode
              kanaData={kanaData}
              onMarkAsLearned={markAsLearned}
              onUpdateScore={updateScore}
              onSwitchToFlashcard={() => setCurrentMode("flashcard")}
              isLearned={isLearned}
            />
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <TableView filteredKana={filteredKana} />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t bg-card py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Dika-sama App. All rights reserved.
        <p>
          Found a bug or have a suggestion? Contact me on{" "}
          <a
            href="https://instagram.com/dikawp_16"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            @dikawp_16
          </a>
        </p>
      </footer>
    </div>
  )
}
