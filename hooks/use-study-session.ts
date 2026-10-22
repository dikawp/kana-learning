"use client"
import { useSyncExternalStore } from "react"
import type { StudyStore } from "@/lib/study/local-store"

export function useStudySession(store: StudyStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}
