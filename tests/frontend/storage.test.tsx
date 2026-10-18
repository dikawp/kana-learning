import { StrictMode } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { hydrateRoot } from "react-dom/client"
import { describe, expect, it, vi } from "vitest"
import { createGuestStore, GUEST_STORAGE_KEY, parseGuestProgress } from "@/lib/progress/guest-store"
import { useKanaProgress } from "@/hooks/use-kana-progress"

const encode = (learnedIds: string[]) => JSON.stringify({ version: 1, learnedIds })
function fixture(raw: string | null = null) {
  const storage = { getItem: vi.fn<(key: string) => string | null>(() => raw), setItem: vi.fn<(key: string, value: string) => void>() }
  let event: (event: { key: string | null; newValue: string | null }) => void = () => {}
  const stop = vi.fn()
  const store = createGuestStore(() => storage, (callback) => { event = callback; return stop })
  return { store, storage, stop, event: (key: string | null, newValue: string | null) => event({ key, newValue }) }
}

describe("clean independent guest storage", () => {
  it("hydrates once without an initial empty write; deduplicates and drops unknown IDs", () => {
    const { store, storage, stop } = fixture(encode(["h-a", "h-a", "unknown", "k-a"]))
    expect(store.getServerSnapshot().status).toBe("loading")
    expect(storage.getItem).not.toHaveBeenCalled()
    const unsubscribe = store.subscribe(vi.fn())
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(GUEST_STORAGE_KEY)
    expect(store.getSnapshot().learnedIds).toEqual(["h-a", "k-a"])
    expect(storage.setItem).not.toHaveBeenCalled()
    store.mark("h-i")
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(GUEST_STORAGE_KEY, encode(["h-a", "k-a", "h-i"]))
    store.mark("h-i")
    store.mark("unknown")
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    unsubscribe()
    expect(stop).toHaveBeenCalledOnce()
  })

  it.each(["{", "null", "[]", '{"version":2,"learnedIds":[]}', '{"version":1,"learnedIds":[7]}'])("rejects invalid data %s without an automatic write", (raw) => {
    expect(() => parseGuestProgress(raw)).toThrow()
    const { store, storage } = fixture(raw)
    store.subscribe(vi.fn())
    expect(store.getSnapshot().status).toBe("memory")
    expect(storage.setItem).not.toHaveBeenCalled()
    store.mark("h-a")
    expect(storage.setItem).toHaveBeenCalledWith(GUEST_STORAGE_KEY, encode(["h-a"]))
  })

  it("survives denied getters, failed reads and quota writes in memory", () => {
    for (const storage of [() => { throw Error("denied getter") }, () => ({ getItem: () => { throw Error("denied read") }, setItem: () => { throw Error("quota") } })]) {
      const store = createGuestStore(storage, () => () => {})
      store.subscribe(vi.fn())
      expect(store.getSnapshot().status).toBe("memory")
      store.mark("h-a")
      expect(store.getSnapshot().learnedIds).toEqual(["h-a"])
      expect(store.getSnapshot().status).toBe("memory")
    }
    const { store, storage } = fixture(encode(["h-a"]))
    storage.setItem.mockImplementation(() => { throw Error("quota") })
    const unsubscribe = store.subscribe(vi.fn())
    store.mark("h-i")
    expect(store.getSnapshot().learnedIds).toEqual(["h-a", "h-i"])
    expect(store.getSnapshot().status).toBe("memory")
    unsubscribe()
    store.subscribe(vi.fn())
    expect(store.getSnapshot().learnedIds).toEqual(["h-a", "h-i"])
  })

  it("replaces cross-tab snapshots, respects resets and never echoes event writes", () => {
    const { store, storage, event } = fixture(encode(["h-a", "k-a"]))
    store.subscribe(vi.fn())
    event("other-key", encode(["h-i"]))
    expect(store.getSnapshot().learnedIds).toEqual(["h-a", "k-a"])
    event(GUEST_STORAGE_KEY, encode(["h-i"]))
    expect(store.getSnapshot().learnedIds).toEqual(["h-i"])
    event(GUEST_STORAGE_KEY, null)
    expect(store.getSnapshot().learnedIds).toEqual([])
    event(GUEST_STORAGE_KEY, encode(["h-a", "k-a"]))
    store.reset("hiragana")
    expect(store.getSnapshot().learnedIds).toEqual(["k-a"])
    store.reset()
    expect(store.getSnapshot().learnedIds).toEqual([])
    expect(storage.setItem).toHaveBeenCalledTimes(2)
    event(null, null)
    expect(store.getSnapshot().learnedIds).toEqual([])
    event(GUEST_STORAGE_KEY, "malformed")
    expect(store.getSnapshot().status).toBe("memory")
  })

  it("reads only the new key and ignores old-origin/legacy contracts", () => {
    localStorage.setItem("kana-learned-characters", '["h-a"]')
    const store = createGuestStore()
    const unsubscribe = store.subscribe(vi.fn())
    expect(store.getSnapshot().learnedIds).toEqual([])
    localStorage.setItem(GUEST_STORAGE_KEY, encode(["h-i"]))
    window.dispatchEvent(new StorageEvent("storage", { storageArea: sessionStorage, key: GUEST_STORAGE_KEY, newValue: encode(["k-a"]) }))
    expect(store.getSnapshot().learnedIds).toEqual([])
    window.dispatchEvent(new StorageEvent("storage", { storageArea: localStorage, key: GUEST_STORAGE_KEY, newValue: encode(["h-i"]) }))
    expect(store.getSnapshot().learnedIds).toEqual(["h-i"])
    unsubscribe()
  })

  it("renders bounded progress in StrictMode, persists/remounts, and labels last score as session-only", () => {
    const { store, storage } = fixture(encode(["h-a", "unknown"]))
    const first = renderHook(() => useKanaProgress(store), { wrapper: StrictMode })
    expect(first.result.current.progress.learnedCharacters.size).toBe(1)
    expect(storage.setItem).not.toHaveBeenCalled()
    act(() => { first.result.current.markAsLearned("k-a"); first.result.current.updateScore(4, 5) })
    expect(first.result.current.progress.hiragana).toBe(1)
    expect(first.result.current.progress.katakana).toBe(1)
    act(() => first.result.current.updateScore(1, 5))
    expect(first.result.current.score).toEqual({ correct: 1, total: 5 })
    const saved = storage.setItem.mock.calls.at(-1)?.[1]
    first.unmount()
    const second = fixture(saved)
    const next = renderHook(() => useKanaProgress(second.store))
    expect(next.result.current.progress.learnedCharacters.size).toBe(2)
    expect(next.result.current.score).toEqual({ correct: 0, total: 0 })
    act(() => next.result.current.resetProgress())
    expect(next.result.current.progress.overall).toBe(0)
  })

  it("hydrates the server snapshot without overwriting stored progress or reporting a mismatch", async () => {
    const { store, storage } = fixture(encode(["h-a"]))
    function Harness() {
      const { progress, storageStatus } = useKanaProgress(store)
      return <p>{storageStatus} Count: {progress.learnedCharacters.size}</p>
    }
    const container = document.createElement("div")
    container.innerHTML = renderToString(<Harness />)
    expect(storage.getItem).not.toHaveBeenCalled()
    expect(container.textContent).toContain("Count: 0")
    document.body.append(container)
    const recoverable = vi.fn()
    let root: ReturnType<typeof hydrateRoot>
    await act(async () => { root = hydrateRoot(container, <Harness />, { onRecoverableError: recoverable }) })
    await waitFor(() => expect(container.textContent).toContain("Count: 1"))
    expect(recoverable).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
    act(() => root.unmount())
    container.remove()
  })
})
