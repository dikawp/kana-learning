"use client"

import { z } from "zod"
import type { Slot } from "@/lib/platform/learning"
import { parseImport, slotSchema } from "@/lib/platform/store"
import { emptyProgress, type JlptProgress } from "./learning"
import { parseJlptProgress } from "./save-schema"
import { readSettledJlpt, replaceJlpt } from "./store"

export type ImportedBackup = { slot: Slot; jlpt: JlptProgress }
const envelope = z
  .object({
    format: z.literal("kana-learn-sakura"),
    version: z.literal(2),
    slot: slotSchema,
    jlpt: z.unknown(),
  })
  .strict()
export function parseBackup(
  raw: string,
  allowedIds: Set<string>,
  allowedDecks: Set<string>,
): ImportedBackup {
  if (new TextEncoder().encode(raw).length > 32 * 1024 * 1024) throw Error("Import exceeds 32 MiB.")
  const value = JSON.parse(raw)
  if (value?.version === 1)
    return { slot: parseImport(raw, allowedIds, allowedDecks), jlpt: emptyProgress() }
  const parsed = envelope.parse(value)
  const slot = parsed.slot as Slot
  if (
    Object.keys(slot.cards).some((id) => !allowedIds.has(id)) ||
    [slot.active, ...slot.history].some(
      (s) => s && (!allowedDecks.has(s.deck) || s.cards.some((c) => !allowedIds.has(c.id))),
    )
  ) {
    throw Error("Save contains cards or sessions outside this catalog.")
  }
  return { slot, jlpt: parseJlptProgress(parsed.jlpt) }
}
export async function exportBackup(slot: Slot) {
  const jlpt = await readSettledJlpt(slot.id)
  return JSON.stringify({ format: "kana-learn-sakura", version: 2, slot, jlpt }, null, 2)
}
export async function stageBackup(backup: ImportedBackup, newSlotId: string) {
  await replaceJlpt(newSlotId, structuredClone(backup.jlpt))
}
