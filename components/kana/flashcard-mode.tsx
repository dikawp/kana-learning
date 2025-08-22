"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import type { KanaCharacter } from "@/types/kana"

interface FlashcardModeProps {
  filteredKana: KanaCharacter[]
  onMarkAsLearned: (kanaId: string) => void
  isLearned: (kanaId: string) => boolean
}

export function FlashcardMode({ filteredKana, onMarkAsLearned, isLearned }: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredKana.length)
    setShowAnswer(false)
  }

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredKana.length) % filteredKana.length)
    setShowAnswer(false)
  }

  if (filteredKana.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No characters match your current filters.</p>
        </CardContent>
      </Card>
    )
  }

  const currentKana = filteredKana[currentIndex]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          <div className="text-6xl font-bold text-primary mb-4">{currentKana?.character}</div>

          {showAnswer && (
            <div className="space-y-2">
              <div className="text-2xl font-semibold text-foreground">{currentKana?.romanji}</div>
              <Badge variant="outline">
                {currentKana?.type} - {currentKana?.category}
              </Badge>
              {isLearned(currentKana.id) && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  ✓ Learned
                </Badge>
              )}
            </div>
          )}

          <div className="flex justify-center gap-4">
            {!showAnswer ? (
              <Button onClick={() => setShowAnswer(true)}>Show Answer</Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!isLearned(currentKana.id)) {
                      onMarkAsLearned(currentKana.id)
                    }
                    nextCard()
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Got it!
                </Button>
                <Button variant="outline" onClick={nextCard}>
                  Next
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button variant="ghost" onClick={prevCard}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {filteredKana.length}
            </span>
            <Button variant="ghost" onClick={nextCard}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
