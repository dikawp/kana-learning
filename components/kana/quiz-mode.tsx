"use client"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, Trophy, CheckCircle, XCircle } from "lucide-react"
import { generateQuizQuestions, calculateQuizResults } from "@/lib/kana/quiz"
import type { KanaCharacter, QuizQuestion, QuizSetup, QuizResults } from "@/types/kana"

interface QuizModeProps {
  kanaData: KanaCharacter[]
  onMarkAsLearned: (kanaId: string) => void
  onUpdateScore: (correct: number, total: number) => void
  onSwitchToFlashcard: () => void
  isLearned: (kanaId: string) => boolean
}

export function QuizMode({ kanaData, onMarkAsLearned, onUpdateScore, onSwitchToFlashcard, isLearned }: QuizModeProps) {
  const [quizState, setQuizState] = useState<"setup" | "playing" | "results">("setup")
  const [quizSetup, setQuizSetup] = useState<QuizSetup>({ type: "all", questionCount: 10 })
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<string[]>([])
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [quizAnswer, setQuizAnswer] = useState<string>("")
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(null)

  const submitted = useRef(false)
  const completed = useRef(false)
  const [setupError, setSetupError] = useState("")

  const startQuiz = () => {
    const questions = generateQuizQuestions(kanaData, quizSetup)
    if (!questions.length) {
      setSetupError("No kana are available for this quiz. Choose another script.")
      return
    }
    setSetupError("")
    setQuizQuestions(questions)
    setCurrentQuestionIndex(0)
    setQuizAnswers([])
    setQuizAnswer("")
    setQuizResult(null)
    setQuizResults(null)
    submitted.current = false
    completed.current = false
    setQuizState("playing")
  }

  const handleQuizAnswer = (answer: string) => {
    const question = quizQuestions[currentQuestionIndex]
    if (quizState !== "playing" || submitted.current || !question?.options.includes(answer)) return
    submitted.current = true
    setQuizAnswer(answer)
    const correct = answer === question.correctAnswer
    setQuizResult(correct ? "correct" : "incorrect")
    setQuizAnswers((previous) => [...previous, answer])
    if (correct && !isLearned(question.character.id)) onMarkAsLearned(question.character.id)
  }

  const advanceQuiz = () => {
    if (!submitted.current || completed.current) return
    if (currentQuestionIndex === quizQuestions.length - 1) {
      completed.current = true
      const results = calculateQuizResults(quizQuestions, quizAnswers)
      setQuizResults(results)
      setQuizState("results")
      onUpdateScore(results.score, results.total)
    } else {
      submitted.current = false
      setCurrentQuestionIndex((previous) => previous + 1)
      setQuizAnswer("")
      setQuizResult(null)
    }
  }

  const resetQuiz = () => {
    submitted.current = false
    completed.current = false
    setQuizState("setup")
    setQuizQuestions([])
    setQuizResults(null)
    setCurrentQuestionIndex(0)
    setQuizAnswers([])
    setQuizAnswer("")
    setQuizResult(null)
    setSetupError("")
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {quizState === "setup" && (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <Target className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-2xl font-bold">Quiz Setup</h3>
              <p className="text-muted-foreground">Quiz uses its own script and question count, independently of browse filters.</p>
            </div>

            <div className="max-w-md mx-auto space-y-4 md:flex justify-between">
              <div className="space-y-2">
                <label htmlFor="quiz-type" className="text-sm font-medium">Quiz Type</label>
                <Select
                  value={quizSetup.type}
                  onValueChange={(value) => { if (value === "all" || value === "hiragana" || value === "katakana") setQuizSetup((prev) => ({ ...prev, type: value })) }}
                >
                  <SelectTrigger id="quiz-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All (Hiragana + Katakana)</SelectItem>
                    <SelectItem value="hiragana">Hiragana Only</SelectItem>
                    <SelectItem value="katakana">Katakana Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="quiz-count" className="text-sm font-medium">Number of Questions</label>
                <Select
                  value={quizSetup.questionCount.toString()}
                  onValueChange={(value) =>
                    setQuizSetup((prev) => ({ ...prev, questionCount: Number.parseInt(value) }))
                  }
                >
                  <SelectTrigger id="quiz-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                    <SelectItem value="25">25 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {setupError && <p role="alert">{setupError}</p>}
            <Button onClick={startQuiz} size="lg">
              Start Quiz
            </Button>
          </div>
        )}

        {quizState === "playing" && quizQuestions[currentQuestionIndex] && (
          <div className="text-center space-y-6">
            <div className="flex justify-between items-center mb-4">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </Badge>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {quizSetup.type === "all"
                    ? "All Types"
                    : quizSetup.type.charAt(0).toUpperCase() + quizSetup.type.slice(1)}
                </Badge>
                {isLearned(quizQuestions[currentQuestionIndex].character.id) && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✓ Learned
                  </Badge>
                )}
              </div>
            </div>

            <div lang="ja" className="text-6xl font-bold text-primary mb-4">
              {quizQuestions[currentQuestionIndex].character.character}
            </div>

            <p className="text-lg">What is the romaji for this character?</p>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {quizQuestions[currentQuestionIndex].options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    quizAnswer === option
                      ? quizResult === "correct"
                        ? "default"
                        : "destructive"
                      : quizResult && option === quizQuestions[currentQuestionIndex].correctAnswer
                        ? "default"
                        : "outline"
                  }
                  onClick={() => handleQuizAnswer(option)}
                  disabled={!!quizResult}
                  className="h-12"
                >
                  {option}
                  {quizResult && option === quizQuestions[currentQuestionIndex].correctAnswer && (
                    <CheckCircle className="h-4 w-4 ml-2" />
                  )}
                  {quizResult &&
                    quizAnswer === option &&
                    option !== quizQuestions[currentQuestionIndex].correctAnswer && (
                      <XCircle className="h-4 w-4 ml-2" />
                    )}
                </Button>
              ))}
            </div>

            {quizResult && (
              <div role="status" className="space-y-2">
                <div
                  className={`text-lg font-semibold ${quizResult === "correct" ? "text-green-600" : "text-red-600"}`}
                >
                  {quizResult === "correct" ? "Correct!" : "Incorrect!"}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Romaji: {quizQuestions[currentQuestionIndex].character.romaji}</div>

                </div>
              </div>
            )}

            {quizResult && <Button onClick={advanceQuiz}>{currentQuestionIndex === quizQuestions.length - 1 ? "See Results" : "Next Question"}</Button>}
            <Button variant="ghost" onClick={resetQuiz}>Cancel Quiz</Button>
            <Progress aria-label="Quiz progress" value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="max-w-md mx-auto" />
          </div>
        )}

        {quizState === "results" && quizResults && (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
              <h3 className="text-3xl font-bold">Quiz Complete!</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{quizResults.score}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{quizResults.total - quizResults.score}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{quizResults.percentage}%</div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <h4 className="text-lg font-semibold mb-4">Review</h4>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {quizResults.questions.map((q, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span lang="ja" className="text-2xl">{q.character.character}</span>
                      <div className="text-left">
                        <div className="font-medium">{q.character.romaji}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {q.isCorrect ? (
                        <span><CheckCircle aria-hidden="true" className="inline h-5 w-5 text-green-600" /> Correct</span>
                      ) : (
                        <div className="text-right">
                          <div className="text-sm text-red-600">Your: {q.userAnswer}</div>
                          <div className="text-sm text-green-600">Correct: {q.correctAnswer}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={resetQuiz} variant="outline">
                New Quiz
              </Button>
              <Button onClick={onSwitchToFlashcard}>Practice More</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
