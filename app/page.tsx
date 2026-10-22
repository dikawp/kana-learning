"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadKana } from "@/lib/content/client"
import type { KanaContent } from "@/lib/content/contracts"
import { createFamiliarityStore } from "@/lib/study/familiarity-store"
import { createStudyStore } from "@/lib/study/local-store"
import { useStudySession } from "@/hooks/use-study-session"
import { calculateQuizResults } from "@/lib/kana/quiz"
import { Button } from "@/components/ui/button"
import { useKanaProgress } from "@/hooks/use-kana-progress"
import { useKanaFilters } from "@/hooks/use-kana-filters"
import { Header } from "@/components/layout/header"
import { ProgressCard } from "@/components/kana/progress-card"
import { FiltersCard } from "@/components/kana/filters-card"
import { FlashcardMode } from "@/components/kana/flashcard-mode"
import { QuizMode } from "@/components/kana/quiz-mode"
import { TableView } from "@/components/kana/table-view"

export default function KanaLearningApp() {
  const [content, setContent] = useState<KanaContent | null>(null)
  const [error, setError] = useState("")
  const [request, retry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    loadKana(controller.signal).then((data) => {
      if (!controller.signal.aborted) { setContent(data); setError("") }
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Learning material is unavailable.")
    })
    return () => controller.abort()
  }, [request])
  if (!content) return <><Header /><main className="container mx-auto p-6">
    {error ? <div role="alert"><p>{error}</p><Button onClick={() => { setError(""); retry((n) => n + 1) }}>Retry material</Button></div> : <p role="status">Loading learning material…</p>}
  </main></>
  return <StudyPage content={content} />
}

function StudyPage({ content }: { content: KanaContent }) {
  const kanaData = content.items
  const [familiarity] = useState(() => createFamiliarityStore(kanaData))
  const [quizzes] = useState(() => createStudyStore(kanaData))
  const history = useStudySession(quizzes).data.history
  const last = history[0] ? calculateQuizResults(history[0].questions, history[0].answers) : null
  const score = { correct: last?.score ?? 0, total: last?.total ?? 0 }
  const [currentMode, setCurrentMode] = useState<"flashcard" | "quiz" | "table">("flashcard")

  const {
    progress,
    storageStatus,
    markAsLearned,
    resetProgress,
    resetHiraganaProgress,
    resetKatakanaProgress,
    isLearned,
  } = useKanaProgress(familiarity, kanaData)

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <p role="status" className="text-sm text-muted-foreground mb-3">{storageStatus} Familiarity is not long-term mastery.</p>
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

        <Tabs value={currentMode} onValueChange={(value) => { if (value === "flashcard" || value === "quiz" || value === "table") setCurrentMode(value) }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flashcard">Flashcard Mode</TabsTrigger>
            <TabsTrigger value="quiz">Quiz Mode</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="flashcard" className="space-y-4">
            <FlashcardMode filteredKana={filteredKana} onMarkAsLearned={markAsLearned} isLearned={isLearned} />
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4" forceMount hidden={currentMode !== "quiz"}>
            <QuizMode
              kanaData={kanaData}
              onMarkAsLearned={markAsLearned}
              store={quizzes}
              revision={content.revision}
              onSwitchToFlashcard={() => setCurrentMode("flashcard")}
              isLearned={isLearned}
            />
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <TableView filteredKana={filteredKana} />
          </TabsContent>
        </Tabs>
      </main>

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
