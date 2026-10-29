"use client"

import { useCallback, useSyncExternalStore } from "react"
import { emptyProgress, type JlptProgress } from "./learning"
import { parseJlptProgress } from "./save-schema"
import { upgradeResourceProgress } from "./migration"

export const JLPT_DATABASE = "kana-learn:jlpt:v1"
type Snapshot = {
  data: JlptProgress | null
  status: "loading" | "saved" | "memory"
  message: string
}
const loading: Snapshot = { data: null, status: "loading", message: "Opening JLPT progress…" }
const snapshots = new Map<string, Snapshot>()
const listeners = new Set<() => void>()
const pending = new Map<string, Promise<void>>()
let database: Promise<IDBDatabase> | undefined
let channel: BroadcastChannel | undefined

function emit() {
  for (const listener of listeners) listener()
}
function openDatabase() {
  if (!database)
    database = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(Error("IndexedDB is unavailable"))
        return
      }
      const request = indexedDB.open(JLPT_DATABASE, 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore("slots")
      }
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(Error("JLPT storage upgrade is blocked by another tab"))
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close()
          database = undefined
        }
        resolve(request.result)
      }
    })
  return database
}
async function readDatabase(slotId: string): Promise<JlptProgress> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("slots", "readonly")
    const request = transaction.objectStore("slots").get(slotId)
    request.onsuccess = () => {
      try {
        resolve(request.result === undefined ? emptyProgress() : parseJlptProgress(request.result))
      } catch (error) {
        reject(error)
      }
    }
    request.onerror = () => reject(request.error)
  })
}
function broadcast(slotId: string, reset = false) {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return
  if (!channel) {
    channel = new BroadcastChannel(JLPT_DATABASE)
    channel.onmessage = (event) => {
      const id = event.data?.slotId
      if (typeof id !== "string" || !snapshots.has(id) || snapshots.get(id)?.status === "memory")
        return
      void readDatabase(id)
        .then((data) => {
          if (!event.data.reset && data.revision < (snapshots.get(id)?.data?.revision ?? 0)) return
          snapshots.set(id, {
            data,
            status: "saved",
            message: "JLPT progress updated from another tab.",
          })
          emit()
        })
        .catch(() => {
          /* Keep the last valid snapshot. */
        })
    }
  }
  channel.postMessage({ slotId, reset })
}
async function load(slotId: string) {
  if (snapshots.has(slotId)) return
  snapshots.set(slotId, loading)
  let fallback = emptyProgress()
  try {
    const before = await readDatabase(slotId)
    fallback = before
    const migrated = upgradeResourceProgress(before)
    const data =
      migrated === before
        ? before
        : parseJlptProgress({ ...migrated, revision: before.revision + 1 })
    fallback = data
    if (data !== before) await writeDatabase(slotId, before, data)
    snapshots.set(slotId, {
      data,
      status: "saved",
      message: "JLPT progress is stored in this browser. Export a backup to keep it.",
    })
    broadcast(slotId)
  } catch {
    snapshots.set(slotId, {
      data: fallback,
      status: "memory",
      message:
        "JLPT storage is unavailable or invalid. Changes stay in memory; existing stored data has not been overwritten. Export before closing.",
    })
  }
  emit()
}
export async function readJlpt(slotId: string) {
  await load(slotId)
  // A subscriber can have started a load in the same event loop.
  if (!snapshots.get(slotId)?.data) {
    await new Promise<void>((resolve) => {
      const listener = () => {
        if (snapshots.get(slotId)?.data) {
          listeners.delete(listener)
          resolve()
        }
      }
      listeners.add(listener)
      listener()
    })
  }
  return structuredClone(snapshots.get(slotId)!.data!)
}
export async function readSettledJlpt(slotId: string) {
  let operation = pending.get(slotId)
  while (operation) {
    await operation.catch(() => {})
    const next = pending.get(slotId)
    if (next === operation) break
    operation = next
  }
  return readJlpt(slotId)
}
async function writeDatabase(slotId: string, before: JlptProgress, data: JlptProgress) {
  const db = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("slots", "readwrite")
    const store = tx.objectStore("slots")
    let conflict = false
    const request = store.get(slotId)
    request.onsuccess = () => {
      try {
        const stored =
          request.result === undefined ? emptyProgress() : parseJlptProgress(request.result)
        if (stored.revision !== before.revision) {
          conflict = true
          tx.abort()
          return
        }
        store.put(data, slotId)
      } catch {
        tx.abort()
      }
    }
    tx.oncomplete = () => resolve()
    tx.onabort = () =>
      reject(conflict ? Error("JLPT_CONFLICT") : (tx.error ?? Error("JLPT write failed")))
    tx.onerror = () => {
      /* onabort handles transaction failure. */
    }
  })
}
export async function updateJlpt(
  slotId: string,
  reducer: (data: JlptProgress) => JlptProgress,
): Promise<void> {
  const operation = (pending.get(slotId) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const before = await readJlpt(slotId)
      const next = reducer(before)
      if (next === before) return
      const data = parseJlptProgress({ ...next, revision: before.revision + 1 })
      if (snapshots.get(slotId)?.status === "memory") {
        snapshots.set(slotId, { ...snapshots.get(slotId)!, data })
        emit()
        return
      }
      try {
        await writeDatabase(slotId, before, data)
        snapshots.set(slotId, {
          data,
          status: "saved",
          message: "JLPT progress saved in this browser.",
        })
        broadcast(slotId)
      } catch (error) {
        if (error instanceof Error && error.message === "JLPT_CONFLICT") {
          const latest = await readDatabase(slotId)
          snapshots.set(slotId, {
            data: latest,
            status: "saved",
            message:
              "Another tab changed this session. The latest progress was loaded; please repeat your last action.",
          })
          emit()
          throw Error(
            "Another tab changed this session. The latest progress was loaded; please repeat your last action.",
            { cause: error },
          )
        } else
          snapshots.set(slotId, {
            data,
            status: "memory",
            message: "JLPT changes could not be saved. Keep this page open and export a backup.",
          })
      }
      emit()
    })
  pending.set(slotId, operation)
  try {
    await operation
  } finally {
    if (pending.get(slotId) === operation) pending.delete(slotId)
  }
}
export async function replaceJlpt(slotId: string, data: JlptProgress) {
  parseJlptProgress(data)
  await updateJlpt(slotId, () => data)
}
export async function deleteJlpt(slotId: string) {
  await (pending.get(slotId) ?? Promise.resolve())
  const current = snapshots.get(slotId)
  // An explicit user reset/delete can remove a record even when it was invalid.
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("slots", "readwrite")
      tx.objectStore("slots").delete(slotId)
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
    })
  } catch {
    if (current?.status !== "memory" && typeof indexedDB !== "undefined")
      throw Error("Could not clear JLPT progress. Your slot has been kept.")
  }
  snapshots.set(slotId, {
    data: emptyProgress(),
    status: current?.status === "memory" ? "memory" : "saved",
    message: "JLPT progress cleared.",
  })
  broadcast(slotId, true)
  emit()
}
export function useJlpt(slotId: string | null) {
  const subscribe = useCallback(
    (listener: () => void) => {
      listeners.add(listener)
      if (slotId) void load(slotId)
      return () => {
        listeners.delete(listener)
      }
    },
    [slotId],
  )
  return useSyncExternalStore(
    subscribe,
    () => (slotId ? (snapshots.get(slotId) ?? loading) : loading),
    () => loading,
  )
}
