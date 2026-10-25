"use client"

import { useSyncExternalStore } from "react"
import { z } from "zod"
import type { Slot } from "./learning"

export const SAVE_KEY = "kana-learn:sakura:v1"
const integer = z.number().int().min(0).max(10000000)
const rating = z.enum(["again", "learning", "known"])
const date = z.string().datetime()
const progress = z
  .object({
    state: rating,
    encounters: integer,
    correct: integer,
    wrong: integer,
    lastPracticedAt: date,
    nextReviewAt: date,
  })
  .strict()
  .refine((p) => p.encounters === p.correct + p.wrong)
const card = z
  .object({
    id: z.string().min(1).max(64),
    glyph: z.string().min(1).max(8),
    kind: z.enum(["hiragana", "katakana", "kanji"]),
    meanings: z.array(z.string().max(500)).min(1).max(100),
    readings: z.array(z.string().max(100)).min(1).max(100),
    group: z.string().optional(),
    romaji: z.string().optional(),
    on: z.array(z.string()),
    kun: z.array(z.string()),
    names: z.array(z.string()),
    strokes: z.number().nullable(),
    grade: z.number().nullable(),
    jlpt: z.number().nullable(),
    frequency: z.number().nullable(),
    words: z
      .array(z.object({ written: z.string(), reading: z.string(), meanings: z.array(z.string()) }))
      .max(6),
  })
  .strict()
const session = z
  .object({
    id: z.string().uuid(),
    deck: z.string().min(1).max(100),
    revision: z.string().regex(/^[a-f0-9]{64}$/),
    mode: z.enum(["flashcards", "quiz", "review"]),
    cards: z.array(card).min(1).max(104),
    questions: z
      .array(
        z
          .object({
            prompt: z.string().min(1).max(1000),
            answerId: z.string(),
            options: z
              .array(z.object({ id: z.string(), label: z.string().max(500) }))
              .min(1)
              .max(4),
            kind: z.enum(["glyph", "reading", "meaning"]),
          })
          .strict(),
      )
      .min(1)
      .max(104),
    answers: z.array(rating.nullable()).max(104),
    choices: z.array(z.string().nullable()).max(104),
    index: integer,
    startedAt: date,
    finishedAt: date.nullable(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (
      s.index >= s.cards.length ||
      s.cards.length !== s.questions.length ||
      s.cards.length !== s.answers.length ||
      s.cards.length !== s.choices.length ||
      s.choices.some((c, i) => c !== null && !s.questions[i]?.options.some((o) => o.id === c)) ||
      new Set(s.cards.map((c) => c.id)).size !== s.cards.length ||
      s.answers.some((a, i) => (i < s.index ? a === null : i > s.index && a !== null)) ||
      (s.finishedAt && s.answers.some((a) => a === null)) ||
      s.questions.some(
        (q, i) =>
          q.answerId !== s.cards[i].id ||
          !q.options.some((o) => o.id === q.answerId) ||
          new Set(q.options.map((o) => o.id)).size !== q.options.length ||
          new Set(q.options.map((o) => o.label.normalize("NFKC").toLowerCase())).size !==
            q.options.length,
      )
    )
      ctx.addIssue({ code: "custom", message: "Invalid session lifecycle" })
  })
const slotSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(60),
    createdAt: date,
    updatedAt: date,
    cards: z
      .record(z.string().min(1).max(64), progress)
      .refine((c) => Object.keys(c).length <= 3000),
    active: session.nullable(),
    history: z.array(session).max(20),
  })
  .strict()
  .refine(
    (s) =>
      !s.active?.finishedAt &&
      s.history.every((h) => h.finishedAt) &&
      new Set(s.history.map((h) => h.id)).size === s.history.length &&
      !s.history.some((h) => h.id === s.active?.id),
  )
const rootSchema = z
  .object({
    version: z.literal(1),
    activeSlotId: z.string().uuid(),
    slots: z.array(slotSchema).min(1).max(8),
  })
  .strict()
  .refine(
    (r) =>
      r.slots.some((s) => s.id === r.activeSlotId) &&
      new Set(r.slots.map((s) => s.id)).size === r.slots.length,
  )
type Save = { version: 1; activeSlotId: string; slots: Slot[] }
type Snapshot = { data: Save | null; status: "loading" | "saved" | "memory"; message: string }
const initial: Snapshot = { data: null, status: "loading", message: "Loading local progress…" }
let snapshot = initial,
  started = false
const listeners = new Set<() => void>()
function emit() {
  for (const l of listeners) l()
}
export function emptySlot(name = "Player 1"): Slot {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    cards: {},
    active: null,
    history: [],
  }
}
const fresh = (): Save => {
  const slot = emptySlot()
  return { version: 1, activeSlotId: slot.id, slots: [slot] }
}
export function parseSave(raw: string): Save {
  if (raw.length > 4 * 1024 * 1024) throw Error("Save exceeds the 4 MB limit.")
  return rootSchema.parse(JSON.parse(raw)) as Save
}
function initialize() {
  if (started || typeof window === "undefined") return
  started = true
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    snapshot = {
      data: raw ? parseSave(raw) : fresh(),
      status: "saved",
      message: "Progress stays in this browser. Export a save to keep a backup.",
    }
  } catch {
    snapshot = {
      data: fresh(),
      status: "memory",
      message:
        "Saved data is unavailable or invalid. Practice works in memory. Existing stored data has not been overwritten.",
    }
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== SAVE_KEY || e.storageArea !== localStorage) return
    try {
      snapshot = {
        data: e.newValue ? parseSave(e.newValue) : fresh(),
        status: "saved",
        message: "Progress updated from another tab.",
      }
      emit()
    } catch {
      /* Keep last valid in-memory snapshot. */
    }
  })
}
export function updateSave(fn: (save: Save) => Save) {
  initialize()
  const before = snapshot.data!
  const data = fn(before)
  if (data === before) return
  try {
    const raw = JSON.stringify(data)
    parseSave(raw)
    // Corrupt/unavailable saves are never overwritten implicitly.
    if (snapshot.status === "memory") {
      snapshot = { ...snapshot, data }
      emit()
      return
    }
    localStorage.setItem(SAVE_KEY, raw)
    snapshot = {
      data,
      status: "saved",
      message: "Progress stays in this browser. Export a save to keep a backup.",
    }
  } catch {
    snapshot = {
      data,
      status: "memory",
      message: "Progress could not be saved. Keep this page open and export a backup.",
    }
  }
  emit()
}
export function updateSlot(fn: (slot: Slot) => Slot) {
  updateSave((s) => {
    const current = s.slots.find((p) => p.id === s.activeSlotId)!,
      next = fn(current)
    return next === current
      ? s
      : { ...s, slots: s.slots.map((p) => (p.id === s.activeSlotId ? next : p)) }
  })
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  initialize()
  return () => {
    listeners.delete(listener)
  }
}
export function useSave() {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  )
  return {
    ...state,
    slot: state.data?.slots.find((s) => s.id === state.data!.activeSlotId) ?? null,
  }
}
export function parseImport(raw: string, allowedIds: Set<string>, allowedDecks?: Set<string>) {
  if (raw.length > 2 * 1024 * 1024) throw Error("Import exceeds 2 MB.")
  let envelope: { format: "kana-learn-sakura"; version: 1; slot: Slot }
  try {
    envelope = z
      .object({ format: z.literal("kana-learn-sakura"), version: z.literal(1), slot: slotSchema })
      .strict()
      .parse(JSON.parse(raw)) as typeof envelope
  } catch {
    throw Error(
      "This is not a valid version 1 Kana-Learn save. Your current progress has not changed.",
    )
  }
  const slot = envelope.slot as Slot
  if (
    Object.keys(slot.cards).some((id) => !allowedIds.has(id)) ||
    slot.active?.cards.some((c) => !allowedIds.has(c.id)) ||
    slot.history.some((s) => s.cards.some((c) => !allowedIds.has(c.id)))
  )
    throw Error("Save contains cards outside this catalog.")
  if (allowedDecks && [slot.active, ...slot.history].some((s) => s && !allowedDecks.has(s.deck)))
    throw Error("Save contains sessions outside this deck catalog.")
  return slot
}
export function exportSlot(slot: Slot) {
  return JSON.stringify({ format: "kana-learn-sakura", version: 1, slot }, null, 2)
}
