import { kanaData } from "../kana-data"

export const GUEST_STORAGE_KEY = "kana-learning:guest:v1"
const knownIds = new Set<string>(kanaData.map((kana) => kana.id))
export type GuestSnapshot = { learnedIds: string[]; status: "loading" | "saved" | "memory"; message: string }
const serverSnapshot: GuestSnapshot = { learnedIds: [], status: "loading", message: "Loading local progress…" }
type StorageAccess = Pick<Storage, "getItem" | "setItem">
type StorageChange = { key: string | null; newValue: string | null }

export function parseGuestProgress(raw: string | null): string[] {
  if (raw === null) return []
  const value: unknown = JSON.parse(raw)
  if (typeof value !== "object" || value === null || !("version" in value) || value.version !== 1 ||
    !("learnedIds" in value) || !Array.isArray(value.learnedIds) || value.learnedIds.length > 10000 ||
    !value.learnedIds.every((id: unknown) => typeof id === "string")) {
    throw new Error("Invalid guest progress")
  }
  return [...new Set<string>(value.learnedIds)].filter((id) => knownIds.has(id))
}

export function createGuestStore(
  storage: () => StorageAccess = () => window.localStorage,
  listen: (callback: (event: StorageChange) => void) => () => void = (callback) => {
    const handler = (event: StorageEvent) => {
      // sessionStorage events must never overwrite guest progress.
      try { if (event.storageArea === window.localStorage) callback(event) } catch { /* unavailable storage has no usable event */ }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  },
) {
  let snapshot = serverSnapshot
  let initialized = false
  let stop: (() => void) | undefined
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  const read = (raw: string | null) => {
    try {
      snapshot = { learnedIds: parseGuestProgress(raw), status: "saved", message: "Progress is stored on this device only." }
    } catch {
      snapshot = { learnedIds: [], status: "memory", message: "Saved progress is invalid. Practice works in memory; your next change will start a new local record." }
    }
  }
  const initialize = () => {
    if (initialized) return
    initialized = true
    try { read(storage().getItem(GUEST_STORAGE_KEY)) } catch {
      snapshot = { learnedIds: [], status: "memory", message: "Storage is unavailable. Progress will last only for this open page." }
    }
  }
  const save = (ids: string[]) => {
    initialize()
    const learnedIds = [...new Set(ids)].filter((id) => knownIds.has(id))
    snapshot = { learnedIds, status: "saved", message: "Progress is stored on this device only." }
    try { storage().setItem(GUEST_STORAGE_KEY, JSON.stringify({ version: 1, learnedIds })) } catch {
      snapshot = { learnedIds, status: "memory", message: "Progress could not be saved. Changes will last only for this open page." }
    }
    notify()
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener)
      if (listeners.size === 1) {
        // Re-read when resubscribing, including StrictMode remounts, unless unsaved memory must be retained.
        if (snapshot.status !== "memory") initialized = false
        initialize()
        stop = listen((event) => {
          if (event.key === GUEST_STORAGE_KEY || event.key === null) {
            read(event.newValue)
            notify()
          }
        })
      }
      return () => { listeners.delete(listener); if (!listeners.size) stop?.() }
    },
    mark(id: string) {
      initialize()
      if (knownIds.has(id) && !snapshot.learnedIds.includes(id)) save([...snapshot.learnedIds, id])
    },
    reset(type?: "hiragana" | "katakana") {
      initialize()
      const remove = new Set<string>(kanaData.filter((kana) => !type || kana.type === type).map((kana) => kana.id))
      save(snapshot.learnedIds.filter((id) => !remove.has(id)))
    },
  }
}

export const guestStore = createGuestStore()
