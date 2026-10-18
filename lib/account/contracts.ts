import type { QuizSetup } from "@/types/kana"

export type Principal = { id: string; email: string | null }
export type AccountProgress = { learnedIds: string[] }
export type QuizFeedback = { answer: string; isCorrect: boolean; correctAnswer: string }
export type AccountQuestion = { id: string; kanaId: string; character: string; type: "hiragana" | "katakana"; options: string[]; feedback: QuizFeedback | null }
export type QuizSummary = { id: string; config: QuizSetup; status: "active" | "completed"; total: number; score: number | null; createdAt: string; completedAt: string | null }
export type AccountQuiz = QuizSummary & { questions: AccountQuestion[] }
export type QuizHistory = { items: QuizSummary[]; nextCursor: string | null }
