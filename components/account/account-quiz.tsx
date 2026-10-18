"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { accountMutation, accountRequest } from "@/lib/account/client"
import type { AccountQuiz, QuizFeedback, QuizHistory } from "@/lib/account/contracts"

export function AccountQuizPanel({ onProgressChanged }: { onProgressChanged: () => void }) {
  const [quiz, setQuiz] = useState<AccountQuiz | null>(null)
  const [history, setHistory] = useState<QuizHistory | null>(null)
  const [type, setType] = useState<"all" | "hiragana" | "katakana">("all")
  const [count, setCount] = useState(5)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState<(() => Promise<void>) | null>(null)
  const running = useRef(false)
  const run = async (operation: () => Promise<void>) => {
    if (running.current) return
    running.current = true; setBusy(true); setError("")
    try { await operation(); setPending(null) } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Quiz request failed.")
    } finally { running.current = false; setBusy(false) }
  }
  const mutate = (operation: () => Promise<void>) => { setPending(() => operation); void run(operation) }
  const refresh = async () => {
    setHistory(await accountRequest<QuizHistory>("/quiz-sessions?limit=10"))
  }
  const question = quiz?.questions.find((entry) => !entry.feedback)
  return <section className="space-y-4 border rounded-lg p-4" aria-label="Account quiz">
    <h2 className="text-xl font-semibold">Account quizzes</h2>
    <p>Answers are checked and saved by the server. You can resume an unfinished quiz from history.</p>
    {!quiz && <div className="flex flex-wrap gap-3 items-end">
      <label>Quiz script <select className="border p-2 bg-background" value={type} disabled={busy || !!pending} onChange={(event) => { const value = event.target.value; if (value === "all" || value === "hiragana" || value === "katakana") setType(value) }}>
        <option value="all">All kana</option><option value="hiragana">Hiragana</option><option value="katakana">Katakana</option>
      </select></label>
      <label>Questions <select className="border p-2 bg-background" value={count} disabled={busy || !!pending} onChange={(event) => setCount(Number(event.target.value))}>{[5, 10, 15, 20, 25].map((n) => <option key={n}>{n}</option>)}</select></label>
      <Button disabled={busy || !!pending} onClick={() => {
        const start = accountMutation<AccountQuiz>("/quiz-sessions", { type, questionCount: count })
        mutate(async () => { setQuiz(await start()); await refresh() })
      }}>Start account quiz</Button>
    </div>}
    {quiz && <div className="space-y-3">
      <p role="status">{quiz.status === "completed" ? `Result: ${quiz.score}/${quiz.total}` : `${quiz.questions.filter((entry) => entry.feedback).length}/${quiz.total} answered`}</p>
      {quiz.status === "active" && question && <div className="space-y-3">
        <p lang="ja" className="text-6xl">{question.character}</p><p>Choose the Romaji.</p>
        <div className="flex flex-wrap gap-2">{question.options.map((answer) => <Button key={answer} disabled={busy || !!pending} onClick={() => {
          const submit = accountMutation<QuizFeedback>(`/quiz-sessions/${quiz.id}/answers`, { questionId: question.id, answer })
          mutate(async () => { await submit(); setQuiz(await accountRequest<AccountQuiz>(`/quiz-sessions/${quiz.id}`)); onProgressChanged() })
        }}>{answer}</Button>)}</div>
      </div>}
      {quiz.status === "active" && !question && <Button disabled={busy || !!pending} onClick={() => {
        const complete = accountMutation<AccountQuiz>(`/quiz-sessions/${quiz.id}/complete`, {})
        mutate(async () => { setQuiz(await complete()); await refresh(); onProgressChanged() })
      }}>Complete quiz</Button>}
      <h3 className="font-semibold">Answer review</h3>
      <ul className="space-y-2">{quiz.questions.filter((entry) => entry.feedback).map((entry) => <li key={entry.id} className="border p-2 rounded">
        <span lang="ja" className="text-2xl">{entry.character}</span>{" "}
        {entry.feedback!.isCorrect ? "Correct" : "Incorrect"} — Your answer: {entry.feedback!.answer}; Romaji: {entry.feedback!.correctAnswer}
      </li>)}</ul>
      <Button variant="outline" disabled={busy || !!pending} onClick={() => setQuiz(null)}>Back to quiz setup</Button>
    </div>}
    {error && <div role="alert"><p>{error}</p>{pending && <Button disabled={busy} onClick={() => { const operation = pending; if (operation) void run(operation) }}>Retry same request</Button>}</div>}
    <Button variant="outline" disabled={busy || !!pending} onClick={() => void run(refresh)}>Load quiz history</Button>
    {history && <div>
      <h3 className="font-semibold">Result history</h3>
      {!history.items.length && <p>No account quizzes yet.</p>}
      <ul>{history.items.map((entry) => <li key={entry.id} className="flex gap-2 items-center py-2">
        <span>{entry.status === "completed" ? `${entry.score}/${entry.total}` : "Unfinished"} · {new Date(entry.createdAt).toLocaleString()}</span>
        <Button variant="outline" disabled={busy || !!pending} onClick={() => void run(async () => setQuiz(await accountRequest<AccountQuiz>(`/quiz-sessions/${entry.id}`)))}>{entry.status === "completed" ? "Review result" : "Resume quiz"}</Button>
      </li>)}</ul>
      {history.nextCursor && <Button disabled={busy || !!pending} onClick={() => void run(async () => {
        const page = await accountRequest<QuizHistory>(`/quiz-sessions?limit=10&cursor=${history.nextCursor}`)
        setHistory({ items: [...history.items, ...page.items], nextCursor: page.nextCursor })
      })}>More history</Button>}
    </div>}
  </section>
}
