import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"
import { kanaData } from "@/lib/kana-data"

// jsdom does not implement scrolling; Radix calls this browser method when focusing options.
HTMLElement.prototype.scrollIntoView = () => {}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ revision: "a".repeat(64), items: kanaData })))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})
