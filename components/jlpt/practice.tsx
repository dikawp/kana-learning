"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useSave } from "@/lib/platform/store"
import { useJlpt, updateJlpt, readJlpt } from "@/lib/jlpt/store"
import {
  beginSession,
  answerQuestion,
  advanceSession,
  selectQuestions,
  type PracticeSession,
} from "@/lib/jlpt/learning"
import { skillLabels, type Level, type Question, type JapaneseBlock } from "@/lib/jlpt/types"
import { Japanese, MixedText } from "./material"
import styles from "./jlpt.module.css"
import { isRetiredPilot } from "@/lib/jlpt/migration"

function Passage({ question, furigana }: { question: Question; furigana: boolean }) {
  const context = (question as Question & { context?: { title: string; blocks: JapaneseBlock[] } })
    .context
  if (!context) return null
  return (
    <article className={styles.card}>
      <h2>Reading passage</h2>
      <h3>{context.title}</h3>
      {context.blocks.map((b) => (
        <p key={b.id}>
          <Japanese text={b.text} reading={b.reading} furigana={furigana} />
        </p>
      ))}
    </article>
  )
}

export function AnswerFeedback({ question, choiceId }: { question: Question; choiceId: string }) {
  const correct = question.answerId === choiceId
  return (
    <div className={styles.feedback} role="status">
      <strong className={correct ? styles.correct : styles.incorrect}>
        {correct ? "Correct" : "Incorrect"}
      </strong>
      <p>
        Your answer:{" "}
        <MixedText text={question.options.find((o) => o.id === choiceId)?.label ?? ""} />
      </p>
      <p>
        Correct answer:{" "}
        <MixedText text={question.options.find((o) => o.id === question.answerId)?.label ?? ""} />
      </p>
      <p lang="en">{question.explanation}</p>
      <p>
        {question.method === "source-derived"
          ? "Source-derived recognition drill; not an official JLPT exam item."
          : "Original exercise; not independently language-reviewed. Earlier session snapshots retain their original content."}
      </p>
      <details>
        <summary>Why the other options do not fit</summary>
        {question.options
          .filter((o) => o.id !== question.answerId)
          .map((o) => (
            <p key={o.id}>
              <MixedText text={o.label} /> —{" "}
              <span lang="en">
                {question.distractors[o.id] ??
                  "No separate explanation is available for this option."}
              </span>
            </p>
          ))}
      </details>
      {question.evidence && (
        <blockquote className={styles.evidence}>
          <p>Supporting passage evidence · {question.evidence.blockId}</p>
          <Japanese text={question.evidence.quote} />
        </blockquote>
      )}
      <p>
        <Link href="/sources#jlpt-materials">Question source notes</Link> ·{" "}
        {question.sourceIds.join(", ")}
      </p>
    </div>
  )
}

export function PracticeRoom({
  level,
  questions,
  mode,
  filterLabel = "All text skills",
  initialSkill = "",
  kanjiReview,
}: {
  level: Level
  questions: Question[]
  mode: "practice" | "review"
  filterLabel?: string
  initialSkill?: string
  kanjiReview?: { href: string; title: string; cardIds: string[] }[]
}) {
  const { slot } = useSave()
  const { data, status, message } = useJlpt(slot?.id ?? null)
  const [skill, setSkill] = useState(initialSkill)
  const [selected, setSelected] = useState<{ questionId: string; choiceId: string } | null>(null)
  const [furigana, setFurigana] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [remote, setRemote] = useState<{ key: string; questions: Question[] }>({
    key: "",
    questions: [],
  })
  const timer = useRef(0)
  const router = useRouter()
  const active = data?.active
  const session = active?.level === level && active.mode === mode ? active : null
  const question = session?.questions[session.index]
  const answer = session?.answers[session.index]
  const reviewIds =
    mode === "review"
      ? Object.values(data?.review ?? {})
          .filter(
            (r) =>
              r.level === level &&
              !isRetiredPilot(r.materialId) &&
              (!skill || r.skill === skill) &&
              Date.parse(r.nextReviewAt) <= now,
          )
          .sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt))
          .slice(0, 20)
          .map((r) => r.materialId)
      : []
  const reviewKey = [...new Set(reviewIds)].join(",")
  const loadingReview = mode === "review" && Boolean(reviewKey) && remote.key !== reviewKey
  useEffect(() => {
    if (mode !== "review" || !reviewKey) return
    const controller = new AbortController()
    void fetch(`/api/jlpt/questions?${new URLSearchParams({ level, ids: reviewKey })}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw Error("Review questions could not be loaded. Please retry by reopening this page.")
        return response.json() as Promise<{ questions: Question[] }>
      })
      .then((result) => {
        if (!controller.signal.aborted) setRemote({ key: reviewKey, questions: result.questions })
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Review questions are unavailable.")
          setRemote({ key: reviewKey, questions: [] })
        }
      })
    return () => controller.abort()
  }, [mode, level, reviewKey])
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(clock)
  }, [])
  useEffect(() => {
    timer.current = performance.now()
  }, [question?.id, session?.id])
  if (!slot || !data) return <p role="status">Opening your local practice notebook…</p>
  const candidates = (
    mode === "review" ? (remote.key === reviewKey ? remote.questions : []) : questions
  ).filter((q) => !skill || q.skill === skill)
  const available = selectQuestions(data, candidates, mode, now)
  const oldDue = slot.cards
  const legacy = kanjiReview
    ?.map((d) => ({
      ...d,
      due: d.cardIds.filter((id) => {
        const p = oldDue[id]
        return p && p.nextReviewAt && Date.parse(p.nextReviewAt) <= now
      }).length,
    }))
    .filter((d) => d.due > 0)
  const scheduled = Object.entries(data.review)
    .filter(([, r]) => r.level === level && (!skill || r.skill === skill))
    .sort((a, b) => a[1].nextReviewAt.localeCompare(b[1].nextReviewAt))
  const start = async () => {
    if (
      active &&
      !window.confirm(
        "Replace your unfinished JLPT session? Recorded answers and review dates are kept.",
      )
    )
      return
    setBusy(true)
    setError("")
    const shuffled = [...available]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const random = new Uint32Array(1)
      crypto.getRandomValues(random)
      const j = random[0] % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    try {
      await updateJlpt(slot.id, (p) => {
        if (p.active?.id !== active?.id || p.active?.index !== active?.index)
          throw Error(
            "Another tab changed the active session. Review the latest session before starting again.",
          )
        return beginSession(p, level, shuffled.slice(0, 10), mode)
      })
      setSelected(null)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The session could not be started. Please try again.",
      )
    } finally {
      setBusy(false)
    }
  }
  const submit = async () => {
    if (!session || !question || selected?.questionId !== question.id) return
    setBusy(true)
    try {
      await updateJlpt(slot.id, (p) =>
        answerQuestion(
          p,
          session.id,
          session.index,
          selected.choiceId,
          performance.now() - timer.current,
        ),
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The answer could not be recorded. Please try again.",
      )
    } finally {
      setBusy(false)
    }
  }
  const next = async () => {
    if (!session || !answer) return
    setBusy(true)
    try {
      await updateJlpt(slot.id, (p) =>
        p.active?.id === session.id && p.active.index === session.index ? advanceSession(p) : p,
      )
      const updated = await readJlpt(slot.id)
      if (updated.history.some((s) => s.id === session.id))
        router.push(`/jlpt/${level}/results/${session.id}`)
      setSelected(null)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The next question could not be opened. Please try again.",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className={styles.stack}>
      {message && (
        <p className={status === "memory" ? "storage-warning" : styles.muted} role="status">
          {message}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {session && question ? (
        <>
          <div className={styles.nav}>
            <Link href={`/jlpt/${level}`}>← Level notebook</Link>
            <button
              className={styles.button}
              aria-pressed={furigana}
              onClick={() => setFurigana(!furigana)}
            >
              Furigana {furigana ? "on" : "off"}
            </button>
          </div>
          <p className="eyebrow">
            {mode.toUpperCase()} · QUESTION {session.index + 1} OF {session.questions.length} ·{" "}
            {skillLabels[question.skill]}
          </p>
          <div
            className={
              (question as Question & { context?: unknown }).context ? styles.columns : undefined
            }
          >
            <Passage question={question} furigana={furigana} />
            <section className={styles.card}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void submit()
                }}
              >
                <h2 className={styles.japanese}>
                  <MixedText text={question.prompt} />
                </h2>
                <p className={styles.muted}>Choose one answer, then submit.</p>
                <fieldset className={styles.options} disabled={Boolean(answer) || busy}>
                  <legend className="sr-only">Answer choices</legend>
                  {question.options.map((o) => (
                    <label className={styles.option} key={o.id}>
                      <input
                        type="radio"
                        name={`answer-${question.id}`}
                        value={o.id}
                        checked={
                          answer
                            ? answer.choiceId === o.id
                            : selected?.questionId === question.id && selected.choiceId === o.id
                        }
                        onChange={() => setSelected({ questionId: question.id, choiceId: o.id })}
                      />
                      <MixedText text={o.label} />
                    </label>
                  ))}
                </fieldset>
                {!answer && (
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={busy || selected?.questionId !== question.id}
                  >
                    Submit answer
                  </button>
                )}
              </form>
              {answer && (
                <>
                  <AnswerFeedback question={question} choiceId={answer.choiceId} />
                  <button className="primary-button" disabled={busy} onClick={() => void next()}>
                    {session.index + 1 === session.questions.length
                      ? "Finish and view results"
                      : "Next question"}{" "}
                    →
                  </button>
                </>
              )}
            </section>
          </div>
          <p className={styles.muted}>
            Answers are saved after submission. You can leave and resume this session in this
            browser.
          </p>
          <details>
            <summary>Start a different session</summary>
            <p>Starting again replaces this unfinished session.</p>
            <button
              className={styles.button}
              disabled={busy || !available.length}
              onClick={() => void start()}
            >
              Replace with a new session
            </button>
          </details>
        </>
      ) : (
        <section className={styles.card}>
          <h2>{mode === "review" ? "Review due concepts" : "Set up text practice"}</h2>
          <p>{filterLabel}</p>
          <label>
            Skill{" "}
            <select value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">All text skills</option>
              <option value="moji-goi">Moji & Goi</option>
              <option value="bunpou">Bunpou</option>
              <option value="dokkai">Dokkai</option>
            </select>
          </label>
          <p role="status">
            {available.length} {mode === "review" ? "due concepts" : "available concepts"} · up to
            10 questions per session
          </p>
          {mode === "review" && (
            <p>
              Incorrect answers return after 10 minutes. Correct answers return after 1, 3, then 7
              days. A different question variant is used when available.
            </p>
          )}
          {active && (
            <p className={styles.notice}>
              You have an unfinished {active.level.toUpperCase()} {active.mode} session.{" "}
              <Link href={`/jlpt/${active.level}/${active.mode}`}>Resume it →</Link>
            </p>
          )}
          {loadingReview ? (
            <p role="status">Loading the next due review questions…</p>
          ) : available.length ? (
            <button className="primary-button" disabled={busy} onClick={() => void start()}>
              {mode === "review" ? "Start due review" : "Start practice"} →
            </button>
          ) : (
            <p className="empty-state">
              {mode === "review"
                ? "No text concepts are due in this selection. Practice a lesson first, or return when its review date arrives."
                : "No practice questions are available for this selection."}
            </p>
          )}
        </section>
      )}
      {mode === "review" && (
        <section className={styles.card}>
          <h2>Scheduled concepts and past mistakes</h2>
          {scheduled.length ? (
            <ul>
              {scheduled.map(([id, r]) => {
                const q = [
                  ...questions,
                  ...remote.questions,
                  ...(data.active?.questions ?? []),
                  ...data.history.flatMap((s) => s.questions),
                ].find((q) => q.conceptId === id || q.materialId === r.materialId)
                return (
                  <li key={id}>
                    <p>
                      {r.streak === 0 ? "Last answer incorrect" : `${r.streak} consecutive correct`}{" "}
                      · next review {new Date(r.nextReviewAt).toLocaleString()}
                    </p>
                    <p>{q && <MixedText text={q.prompt} />}</p>
                    <div className={styles.nav}>
                      <Link href={`/jlpt/${r.level}/${r.skill}/${r.materialId}`}>
                        Revisit lesson
                      </Link>
                      {!isRetiredPilot(r.materialId) && (
                        <Link href={`/jlpt/${r.level}/practice?material=${r.materialId}`}>
                          Practice again now
                        </Link>
                      )}
                      {isRetiredPilot(r.materialId) && (
                        <span>This pilot entry is retired; its recorded answers are retained.</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p>Your answered concepts will appear here with their actual review dates.</p>
          )}
        </section>
      )}
      {mode === "review" && (
        <section className={styles.card}>
          <h2>Kanji card review</h2>
          <p>Kanji uses the existing card review notebook and its saved ratings.</p>
          {legacy?.length ? (
            <ul>
              {legacy.map((d) => (
                <li key={d.href}>
                  <Link href={d.href}>
                    {d.title}: {d.due} due cards →
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No kanji cards in this level are due from saved ratings.</p>
          )}
          <Link href={`/set/jlpt-${level}`}>Open canonical kanji notebook →</Link>
        </section>
      )}
    </div>
  )
}

function SessionResult({ session }: { session: PracticeSession }) {
  const answers = session.answers.filter((a) => a !== null)
  const correct = answers.filter((a) => a.correct).length
  const duration = answers.reduce((n, a) => n + a.durationMs, 0)
  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <h2>Completed {session.mode}</h2>
        <div className={styles.summary}>
          <p>
            <strong>
              {correct}/{answers.length}
            </strong>
            correct answers
          </p>
          <p>
            <strong>
              {answers.length ? `${Math.round((correct / answers.length) * 100)}%` : "—"}
            </strong>
            session accuracy
          </p>
          <p>
            <strong>{Math.round(duration / 1000)}s</strong>answering time
          </p>
        </div>
        <p>Completed {session.finishedAt ? new Date(session.finishedAt).toLocaleString() : "—"}</p>
        <p className={styles.muted}>
          A learning practice result, not an official JLPT score or pass prediction. Question
          versions are kept in this saved session.
        </p>
      </section>
      {session.questions.map((q, i) => (
        <article className={styles.card} key={`${q.id}-${i}`}>
          <span className="eyebrow">
            QUESTION {i + 1} · VERSION {q.version}
          </span>
          <h3>
            <MixedText text={q.prompt} />
          </h3>
          <Passage question={q} furigana />
          <>
            {session.answers[i] && (
              <AnswerFeedback question={q} choiceId={session.answers[i]!.choiceId} />
            )}
          </>
          <Link href={`/jlpt/${q.level}/${q.skill}/${q.materialId}`}>Revisit lesson →</Link>
        </article>
      ))}
    </div>
  )
}
export function SavedResult({ level, sessionId }: { level: Level; sessionId: string }) {
  const { slot } = useSave()
  const { data } = useJlpt(slot?.id ?? null)
  if (!data) return <p role="status">Opening saved results…</p>
  const session = data.history.find((s) => s.id === sessionId && s.level === level)
  if (!session)
    return (
      <div className="empty-state">
        <h2>Result unavailable in this local slot</h2>
        <p>
          This result may belong to another browser or save slot, or it may have been removed from
          history.
        </p>
        <Link href={`/jlpt/${level}`}>Return to the level notebook →</Link>
      </div>
    )
  return (
    <>
      <SessionResult session={session} />
      <div className={styles.nav}>
        <Link href={`/jlpt/${level}/review`}>Review schedule</Link>
        <Link href={`/jlpt/${level}/practice`}>New practice</Link>
        <Link href={`/jlpt/${level}`}>Level notebook</Link>
      </div>
    </>
  )
}
