import type { KanaCharacter, QuizQuestion, QuizResults, QuizSetup } from "../../types/kana"

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateQuizQuestions(data: KanaCharacter[], setup: QuizSetup, random = Math.random): QuizQuestion[] {
  if (!Number.isInteger(setup.questionCount) || setup.questionCount <= 0) return []
  const pool = data.filter((kana) => setup.type === "all" || kana.type === setup.type)
  const unique = [...new Map(pool.map((kana) => [kana.id, kana])).values()]
  return shuffle(unique, random).slice(0, setup.questionCount).map((character) => {
    const distractors = [...new Set(data.filter((kana) => kana.type === character.type && kana.romaji !== character.romaji).map((kana) => kana.romaji))]
    return {
      character,
      correctAnswer: character.romaji,
      options: shuffle([character.romaji, ...shuffle(distractors, random).slice(0, 3)], random),
    }
  })
}

export function calculateQuizResults(questions: QuizQuestion[], answers: string[]): QuizResults {
  const review = questions.map((question, index) => ({
    character: question.character,
    correctAnswer: question.correctAnswer,
    userAnswer: answers[index] ?? "",
    isCorrect: answers[index] === question.correctAnswer,
  }))
  const score = review.filter((question) => question.isCorrect).length
  return { score, total: review.length, percentage: review.length ? Math.round(score / review.length * 100) : 0, questions: review }
}
