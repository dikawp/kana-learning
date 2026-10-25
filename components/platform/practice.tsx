"use client"

import Link from "next/link"
import { useState } from "react"
import { ReadingText } from "./reading-text"
import { Check, ArrowRight, RotateCcw } from "lucide-react"
import type { Deck, StudyCard } from "@/lib/platform/types"
import { useSave, updateSlot } from "@/lib/platform/store"
import { startSession, rate, advance, result, type Mode } from "@/lib/platform/learning"

export function Practice({
  deck,
  cards,
  revision,
  initialMode,
}: {
  deck: Deck
  cards: StudyCard[]
  revision: string
  initialMode: Mode
}) {
  const { slot, message, status } = useSave(),
    [mode, setMode] = useState<Mode>(initialMode),
    [completed, setCompleted] = useState<string | null>(null),
    [revealed, setRevealed] = useState(false),
    [empty, setEmpty] = useState(false),
    [selected, setSelected] = useState<string | null>(null)
  if (!slot)
    return (
      <div role="status" className="empty-state">
        Opening your notebook…
      </div>
    )
  const session = slot.active?.deck === deck.slug ? slot.active : null
  const activeMode = session?.mode ?? mode,
    current = session?.cards[session.index],
    question = session?.questions[session.index],
    answer = session?.answers[session.index]
  const finished = completed ? slot.history.find((h) => h.id === completed) : null
  const begin = () => {
    if (
      slot.active &&
      !window.confirm(
        "Replace the unfinished session? Progress from answers already given is kept.",
      )
    )
      return
    const next = startSession(slot, deck.slug, revision, mode, cards)
    if (!next.cards.length) {
      setEmpty(true)
      return
    }
    updateSlot((s) => ({ ...s, active: next }))
    setCompleted(null)
    setRevealed(false)
    setSelected(null)
    setEmpty(false)
  }
  const changeMode = (next: Mode) => {
    if (
      slot.active &&
      !window.confirm("Leave this session and switch modes? Recorded card progress is kept.")
    )
      return
    updateSlot((s) => ({ ...s, active: null }))
    setMode(next)
    setCompleted(null)
    setEmpty(false)
    setRevealed(false)
    setSelected(null)
  }
  const nextCard = () => {
    if (!session) return
    if (session.index === session.cards.length - 1) setCompleted(session.id)
    updateSlot((s) => advance(s))
    setRevealed(false)
    setSelected(null)
  }
  return (
    <div className="practice-room">
      <div className="practice-top">
        <Link href={`/deck/${deck.slug}`} className="quiet-link">
          ← Back to deck
        </Link>
        <div>
          <span className="eyebrow">YOUR PRACTICE ROOM</span>
          <h1>{deck.title}</h1>
        </div>
        <Link href="/dashboard" className="quiet-link">
          Progress ↗
        </Link>
      </div>
      <nav className="mode-switch" aria-label="Practice mode">
        {(["flashcards", "quiz", "review"] as const).map((m) => (
          <button key={m} aria-pressed={activeMode === m} onClick={() => changeMode(m)}>
            {m === "flashcards" ? "Flashcards" : m === "quiz" ? "Quiz" : "Review"}
          </button>
        ))}
      </nav>
      {status === "memory" && (
        <p className="storage-warning" role="status">
          {message}
        </p>
      )}
      {session && current && question ? (
        <>
          <div className="practice-caption">
            <span>
              {activeMode.toUpperCase()} / {session.index + 1} OF {session.cards.length}
            </span>
            <span>{session.answers.filter((a) => a && a !== "again").length} correct</span>
          </div>
          <progress
            className="session-progress"
            aria-label="Session progress"
            value={session.answers.filter(Boolean).length}
            max={session.cards.length}
          />
          <div className="recall-card">
            <span className="eyebrow">
              {activeMode === "quiz"
                ? `RECALL THE ${question.kind === "glyph" ? "READING / MEANING" : "CHARACTER"}`
                : "PAUSE. WHAT DO YOU REMEMBER?"}
            </span>
            <div
              className={`recall-prompt ${activeMode === "quiz" && question.kind === "meaning" ? "meaning-prompt" : ""}`}
              lang={activeMode !== "quiz" || question.kind === "glyph" ? "ja" : undefined}
            >
              {activeMode === "quiz" ? question.prompt : current.glyph}
            </div>
            {(revealed || answer) && activeMode !== "quiz" && (
              <div className="revealed-answer" role="status">
                <h2>{current.meanings.join(" · ")}</h2>
                <p>
                  {current.kind === "kanji" ? (
                    <ReadingText readings={current.readings} />
                  ) : (
                    current.romaji
                  )}
                </p>
                <Link href={`/card/${current.id}`} target="_blank" rel="noopener noreferrer">
                  Open character notes ↗ <span className="sr-only">(new tab)</span>
                </Link>
              </div>
            )}
          </div>
          {answer ? (
            <div className="answer-feedback" role="status">
              <p className={answer === "again" ? "feedback-again" : "feedback-correct"}>
                {answer === "again" ? (
                  "A little more practice. You will meet this one again."
                ) : (
                  <>
                    <Check size={18} />{" "}
                    {answer === "learning"
                      ? "Getting closer. Keep it in your learning queue."
                      : "Got it. A small step forward."}
                  </>
                )}
              </p>
              {activeMode === "quiz" && (
                <p>Answer: {question.options.find((o) => o.id === question.answerId)?.label}</p>
              )}
              <button className="primary-button" onClick={nextCard}>
                {session.index === session.cards.length - 1 ? "See your results" : "Next character"}
                <ArrowRight size={17} />
              </button>
            </div>
          ) : activeMode === "quiz" ? (
            <div className="quiz-options">
              {question.options.map((o) => (
                <button
                  className="quiz-option"
                  key={o.id}
                  aria-pressed={selected === o.id}
                  onClick={() => {
                    setSelected(o.id)
                    updateSlot((s) =>
                      rate(
                        s,
                        session.id,
                        session.index,
                        o.id === question.answerId ? "known" : "again",
                        Date.now(),
                        o.id,
                      ),
                    )
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : revealed ? (
            <div className="rating-options">
              {(
                [
                  ["again", "Missed", "Try again soon"],
                  ["learning", "Almost", "Still finding the shape"],
                  ["known", "Got It", "Let it settle"],
                ] as const
              ).map(([r, title, help]) => (
                <button
                  key={r}
                  className={`rating-option rating-${r}`}
                  onClick={() => updateSlot((s) => rate(s, session.id, session.index, r))}
                >
                  <strong>{title}</strong>
                  <small>{help}</small>
                </button>
              ))}
            </div>
          ) : (
            <button className="primary-button reveal-button" onClick={() => setRevealed(true)}>
              Show answer
            </button>
          )}
          <button
            className="quiet-link finish-later"
            onClick={() => {
              if (
                window.confirm(
                  "End this session? Recorded card progress is kept, but the unfinished run will be discarded.",
                )
              )
                updateSlot((s) => ({ ...s, active: null }))
            }}
          >
            End session
          </button>
        </>
      ) : finished ? (
        <div className="session-summary">
          <span className="eyebrow">ONE MORE PAGE IN YOUR NOTEBOOK</span>
          <h2>Practice, not perfection.</h2>
          <div className="result-score">
            {result(finished).correct}
            <small> / {result(finished).total}</small>
          </div>
          <p>
            {result(finished).accuracy}% correct · {finished.cards.length} characters revisited.
          </p>
          <details>
            <summary>Review this run</summary>
            <div className="answer-review">
              {finished.cards.map((c, i) => (
                <Link key={c.id} href={`/card/${c.id}`}>
                  <span lang="ja">{c.glyph}</span>
                  <span>{c.meanings[0]}</span>
                  <strong>{finished.answers[i] === "again" ? "Needs practice" : "Recalled"}</strong>
                </Link>
              ))}
            </div>
          </details>
          <button className="primary-button" onClick={begin}>
            <RotateCcw size={17} />
            Practice again
          </button>
          <Link className="secondary-button" href="/dashboard">
            Your progress
          </Link>
        </div>
      ) : (
        <div className="practice-welcome">
          <span className="welcome-glyph" lang="ja" aria-hidden="true">
            {cards[0]?.glyph}
          </span>
          <span className="eyebrow">{deck.cardIds.length} CHARACTERS · AT YOUR OWN PACE</span>
          <h2>
            {empty
              ? "Nothing needs review just now."
              : mode === "quiz"
                ? "A little recall goes a long way."
                : mode === "review"
                  ? "Return to the tricky ones."
                  : "One character at a time."}
          </h2>
          <p>
            {empty
              ? "Your learning queue is clear. Meet new cards in Flashcards, or try a quiz."
              : mode === "quiz"
                ? "Up to 20 questions. Take a breath before you choose."
                : mode === "review"
                  ? "Revisit missed, learning, and due characters in this deck."
                  : "Look at the shape, recall the reading, then reveal and rate."}
          </p>
          {slot.active && (
            <p className="storage-warning">
              An unfinished {slot.active.mode} session is saved in another deck.{" "}
              <Link href={`/deck/${slot.active.deck}/practice`}>Continue it</Link> or replace it
              below.
            </p>
          )}
          {empty ? (
            <button className="primary-button" onClick={() => changeMode("flashcards")}>
              Go to Flashcards
            </button>
          ) : (
            <button className="primary-button" onClick={begin}>
              Start {mode}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}
      <p className="practice-footnote">
        Saved on this device · No account needed · <Link href="/dashboard">Export a backup</Link>
      </p>
    </div>
  )
}
