"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RotateCcw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DetailedProgress {
  overall: number
  hiragana: number
  katakana: number
  learnedCharacters: Set<string>
}

interface ProgressCardProps {
  progress: DetailedProgress
  score: { correct: number; total: number }
  onResetProgress: () => void
  onResetHiraganaProgress: () => void
  onResetKatakanaProgress: () => void
}

export function ProgressCard({
  progress,
  score,
  onResetProgress,
  onResetHiraganaProgress,
  onResetKatakanaProgress,
}: ProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Learning Progress</CardTitle>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Hiragana
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Hiragana Progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all your Hiragana learning progress. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onResetHiraganaProgress}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Katakana
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Katakana Progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all your Katakana learning progress. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onResetKatakanaProgress}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all your learning progress including both Hiragana and Katakana. This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onResetProgress}>Reset All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{progress.overall}%</span>
            </div>
            <Progress value={progress.overall} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Hiragana Progress</span>
              <span>{progress.hiragana}%</span>
            </div>
            <Progress value={progress.hiragana} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Katakana Progress</span>
              <span>{progress.katakana}%</span>
            </div>
            <Progress value={progress.katakana} className="h-2" />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Badge variant="secondary">Characters Learned: {progress.learnedCharacters.size}</Badge>
            {score.total > 0 && (
              <Badge variant="secondary">
                Quiz Score: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
