export type KanaCharacter = {
  id: string
  character: string
  romanji: string
  type: "hiragana" | "katakana"
  category: string
}

export type QuizQuestion = {
  character: KanaCharacter
  options: string[]
  correctAnswer: string
}

export type QuizSetup = {
  type: "hiragana" | "katakana" | "all"
  questionCount: number
}

export type QuizResults = {
  score: number
  total: number
  percentage: number
  questions: Array<{
    character: KanaCharacter
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
}
