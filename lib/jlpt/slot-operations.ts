"use client"

import { z } from "zod"
import { emptySlot, updateSave, getSaveStatus } from "@/lib/platform/store"
import { deleteJlpt } from "./store"

const key = "kana-learn:jlpt:slot-operations:v1"
const operationSchema = z.object({ slotId: z.uuid(), action: z.enum(["reset", "delete"]) }).strict()
type Operation = z.infer<typeof operationSchema>
let recovery: Promise<void> | undefined
function commit(operation: Operation) {
  updateSave((save) => {
    const slot = save.slots.find((s) => s.id === operation.slotId)
    if (!slot) return save
    if (operation.action === "reset")
      return {
        ...save,
        slots: save.slots.map((s) =>
          s.id === slot.id ? { ...emptySlot(s.name), id: s.id, createdAt: s.createdAt } : s,
        ),
      }
    const slots = save.slots.filter((s) => s.id !== slot.id)
    if (!slots.length) slots.push(emptySlot())
    return {
      ...save,
      slots,
      activeSlotId: save.activeSlotId === slot.id ? slots[0].id : save.activeSlotId,
    }
  })
}
export async function recoverSlotOperations() {
  if (recovery) return recovery
  recovery = (async () => {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const operation = operationSchema.parse(JSON.parse(raw))
    await deleteJlpt(operation.slotId)
    commit(operation)
    if (getSaveStatus() !== "saved")
      throw Error(
        "Slot change is in memory. Keep this page open and export a backup; the pending change will be recovered when storage is available.",
      )
    localStorage.removeItem(key)
  })().finally(() => {
    recovery = undefined
  })
  return recovery
}
export async function clearSlot(slotId: string, action: Operation["action"]) {
  await recoverSlotOperations()
  const operation = operationSchema.parse({ slotId, action })
  localStorage.setItem(key, JSON.stringify(operation))
  await deleteJlpt(slotId)
  commit(operation)
  if (getSaveStatus() !== "saved")
    throw Error(
      "Slot change is in memory. Keep this page open and export a backup; the pending change will be recovered when storage is available.",
    )
  localStorage.removeItem(key)
}
