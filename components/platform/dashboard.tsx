"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Flower2, Download, Upload } from "lucide-react"
import type { Catalog, Kind } from "@/lib/platform/types"
import type { Slot } from "@/lib/platform/learning"
import { stats, levelFor, result } from "@/lib/platform/learning"
import {
  useSave,
  updateSave,
  updateSlot,
  emptySlot,
  exportSlot,
  parseImport,
} from "@/lib/platform/store"
import { PageHeading } from "./catalog"

export function Dashboard({ catalog }: { catalog: Catalog }) {
  const { slot, data, status, message } = useSave(),
    [filter, setFilter] = useState<Kind | "all">("all"),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<Slot | null>(null),
    [page, setPage] = useState(1)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])
  if (!slot || !data) return <div role="status">Opening your local notebook…</div>
  const ids = catalog.cards.filter((c) => filter === "all" || c.kind === filter).map((c) => c.id),
    summary = stats(slot, ids, now),
    overall = stats(slot, undefined, now),
    level = levelFor(overall.correct)
  const decks = catalog.decks
    .filter((d) => filter === "all" || d.kind === filter)
    .map((d) => ({ deck: d, stats: stats(slot, d.cardIds, now) }))
    .sort((a, b) => b.stats.due - a.stats.due || b.stats.seen - a.stats.seen)
  const recommendation =
    (slot.active
      ? catalog.decks.find((d) => d.slug === slot.active!.deck)
      : decks.find((d) => d.stats.due || d.stats.seen < d.deck.cardIds.length)?.deck) ??
    catalog.decks[0]
  const add = (next: Slot) => {
    if (data.slots.length >= 8) {
      setError("You can keep up to eight save slots. Export and remove a slot first.")
      return
    }
    updateSave((s) => ({ ...s, activeSlotId: next.id, slots: [...s.slots, next] }))
    setError("")
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportSlot(slot)], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `kana-learn-${slot.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <>
      <PageHeading eyebrow="YOUR LOCAL NOTEBOOK" title={`Keep growing, ${slot.name}.`}>
        Small returns become familiar paths. Your progress belongs to this browser.
      </PageHeading>
      <p role="status" className={status === "memory" ? "storage-warning" : "storage-note"}>
        {message}
      </p>
      <div className="dashboard-hero">
        <div className="level-flower">
          <Flower2 size={48} strokeWidth={1} />
          <strong>{level.level}</strong>
          <span>LEVEL</span>
        </div>
        <div>
          <span className="eyebrow">THE NEXT SMALL STEP</span>
          <h2>{level.required - level.current} EXP to your next chapter.</h2>
          <progress aria-label="Level progress" value={level.current} max={level.required} />
          <p>
            {overall.correct} EXP earned · +1 for each correct response or Almost/Got It rating.
          </p>
          <Link
            className="primary-button"
            href={`/deck/${recommendation.slug}/practice${`?mode=${slot.active?.mode ?? (summary.due ? "review" : "flashcards")}`}`}
          >
            {slot.active
              ? "Continue practice"
              : summary.due
                ? "Return to review"
                : "Start your next deck"}{" "}
            ↗
          </Link>
        </div>
      </div>
      <label className="dashboard-filter">
        Writing system
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as Kind | "all")
            setPage(1)
          }}
        >
          <option value="all">All characters</option>
          <option value="hiragana">Hiragana</option>
          <option value="katakana">Katakana</option>
          <option value="kanji">Kanji</option>
        </select>
      </label>
      <div className="stats-grid">
        {[
          ["Seen", summary.seen],
          ["Known", summary.known],
          ["Mastered", summary.mastered],
          ["Accuracy", summary.accuracy === null ? "—" : `${summary.accuracy}%`],
          ["Due now", summary.due],
          [
            "Saved runs",
            slot.history.filter((s) => filter === "all" || s.cards[0]?.kind === filter).length,
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="fine-print">
        Known reflects your latest rating. Mastered means 100 correct responses per card; it is an
        app metric, not a guarantee of long-term mastery. Saved runs shows the last 20 completed
        sessions.
      </p>
      <section>
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR READING MAP</span>
            <h2>Progress by deck</h2>
          </div>
          <span>
            {summary.seen} / {ids.length} encountered
          </span>
        </div>
        <div className="deck-progress-grid">
          {decks.slice(0, page * 12).map(({ deck: d, stats: p }) => (
            <Link
              href={`/deck/${d.slug}/practice?mode=${p.due ? "review" : "flashcards"}`}
              key={d.slug}
            >
              <h3>{d.title}</h3>
              <progress
                value={p.known}
                max={d.cardIds.length}
                aria-label={`${d.title} known progress`}
              />
              <p>
                {p.known} known · {d.cardIds.length - p.seen} new · {p.due} due
              </p>
            </Link>
          ))}
        </div>
        {decks.length > page * 12 && (
          <button className="secondary-button load-more" onClick={() => setPage((p) => p + 1)}>
            More decks
          </button>
        )}
      </section>
      <section>
        <h2>Characters asking for another look</h2>
        <div className="link-pills">
          {catalog.cards
            .filter(
              (c) =>
                ids.includes(c.id) &&
                slot.cards[c.id] &&
                (slot.cards[c.id].state !== "known" ||
                  Date.parse(slot.cards[c.id].nextReviewAt) <= now),
            )
            .slice(0, 24)
            .map((c) => (
              <Link href={`/card/${c.id}`} key={c.id} lang="ja">
                {c.glyph}
              </Link>
            ))}
        </div>
        {summary.seen === summary.known && !summary.due && (
          <p className="muted">No weak or due cards in this collection yet.</p>
        )}
      </section>
      <section>
        <h2>Recent practice</h2>
        {slot.history.length ? (
          <div className="history-list">
            {slot.history.map((s) => (
              <details key={s.id}>
                <summary>
                  {catalog.decks.find((d) => d.slug === s.deck)?.title ?? s.deck} · {s.mode} ·{" "}
                  {result(s).correct}/{s.cards.length} ·{" "}
                  {new Date(s.finishedAt!).toLocaleDateString("en-GB")}
                </summary>
                <div className="answer-review">
                  {s.cards.map((c, i) => (
                    <Link href={`/card/${c.id}`} key={c.id}>
                      <span lang="ja">{c.glyph}</span>
                      <span>{c.meanings[0]}</span>
                      <strong>{s.answers[i] === "again" ? "Needs practice" : "Recalled"}</strong>
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="muted">Your first completed run will appear here.</p>
        )}
      </section>
      <section className="save-panel">
        <span className="eyebrow">KEEP YOUR NOTEBOOK SAFE</span>
        <h2>Save slots & backups</h2>
        <p>
          Each slot is a separate local learner. Clearing browser data removes these saves. Existing
          pre-redesign saves are untouched and are not imported automatically.
        </p>
        <div className="save-controls">
          <label>
            Active save
            <select
              value={slot.id}
              onChange={(e) => {
                updateSave((s) => ({ ...s, activeSlotId: e.target.value }))
                setPreview(null)
                setName("")
              }}
            >
              {data.slots.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button"
            onClick={() => add(emptySlot(`Player ${data.slots.length + 1}`))}
          >
            New slot
          </button>
          <button
            className="secondary-button"
            onClick={() =>
              add({
                ...structuredClone(slot),
                id: crypto.randomUUID(),
                name: `${slot.name.slice(0, 50)} Copy`,
              })
            }
          >
            Duplicate
          </button>
        </div>
        <form
          className="save-controls"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) {
              updateSlot((s) => ({ ...s, name: name.trim().slice(0, 60) }))
              setName("")
            }
          }}
        >
          <label>
            Rename active slot
            <input
              placeholder={slot.name}
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button className="secondary-button" type="submit">
            Rename
          </button>
        </form>
        <div className="save-controls">
          <button className="primary-button" onClick={download}>
            <Download size={17} />
            Export save
          </button>
          <label className="secondary-button import-label">
            <Upload size={17} />
            Import save
            <input
              type="file"
              accept="application/json,.json"
              aria-label="Import save file"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (!file) return
                try {
                  if (file.size > 2 * 1024 * 1024) throw Error("Import exceeds 2 MB.")
                  setPreview(
                    parseImport(
                      await file.text(),
                      new Set(catalog.cards.map((c) => c.id)),
                      new Set(catalog.decks.map((d) => d.slug)),
                    ),
                  )
                  setError("")
                } catch (err) {
                  setPreview(null)
                  setError(err instanceof Error ? err.message : "Invalid save file.")
                }
              }}
            />
          </label>
        </div>
        {preview && (
          <div className="import-preview">
            <h3>Import as a new slot?</h3>
            <p>
              {preview.name} · {Object.keys(preview.cards).length} cards seen ·{" "}
              {preview.history.length} saved runs. Your current slot will be kept.
            </p>
            <button
              className="primary-button"
              onClick={() => {
                add({ ...preview, id: crypto.randomUUID() })
                setPreview(null)
              }}
            >
              Confirm import
            </button>
            <button className="secondary-button" onClick={() => setPreview(null)}>
              Cancel
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="storage-warning">
            {error}
          </p>
        )}
        <div className="danger-controls">
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Reset all progress in ${slot.name}? This cannot be undone. Export a backup first.`,
                )
              )
                updateSlot((s) => ({ ...emptySlot(s.name), id: s.id, createdAt: s.createdAt }))
            }}
          >
            Reset progress
          </button>
          <button
            onClick={() => {
              if (
                !window.confirm(
                  `Delete ${slot.name}? Export a backup first. This cannot be undone.`,
                )
              )
                return
              updateSave((s) => {
                const slots = s.slots.filter((p) => p.id !== slot.id)
                if (!slots.length) slots.push(emptySlot())
                return { ...s, slots, activeSlotId: slots[0].id }
              })
            }}
          >
            Delete slot
          </button>
        </div>
      </section>
    </>
  )
}
