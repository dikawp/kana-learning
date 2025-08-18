"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RotateCcw } from "lucide-react"

interface ProgressCardProps {
  progressPercentage: number
  score: { correct: number; total: number }
  onResetProgress: () => void
}

export function ProgressCard({ progressPercentage, score, onResetProgress }: ProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Learning Progress</CardTitle>
          <Button variant="outline" size="sm" onClick={onResetProgress}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          {score.total > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">
                Quiz Score: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
