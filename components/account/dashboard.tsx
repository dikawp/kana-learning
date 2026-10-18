"use client"

import { useEffect, useRef, useState } from "react"
import { accountMutation, accountRequest } from "@/lib/account/client"
import type { Principal, AccountProgress } from "@/lib/account/contracts"
import type { KanaCharacter } from "@/types/kana"
import { FlashcardMode } from "@/components/kana/flashcard-mode"
import { FiltersCard } from "@/components/kana/filters-card"
import { useKanaFilters } from "@/hooks/use-kana-filters"
import { Button } from "@/components/ui/button"
import { AccountQuizPanel } from "./account-quiz"
import Link from "next/link"

export function AccountDashboard({ user, onSignedOut }: { user: Principal; onSignedOut: () => void }) {
  const [content, setContent] = useState<KanaCharacter[]>([])
  const [progress, setProgress] = useState<AccountProgress>({ learnedIds: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState<(() => Promise<void>) | null>(null)
  const running = useRef(false)
  const filters = useKanaFilters(content)
  const load = async (signal?: AbortSignal) => {
    const [data, saved] = await Promise.all([accountRequest<{ items: KanaCharacter[] }>("/content/kana", undefined, "GET", signal), accountRequest<AccountProgress>("/me/progress", undefined, "GET", signal)])
    setContent(data.items); setProgress(saved); setLoading(false)
  }
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([accountRequest<{ items: KanaCharacter[] }>("/content/kana", undefined, "GET", controller.signal), accountRequest<AccountProgress>("/me/progress", undefined, "GET", controller.signal)])
      .then(([data, saved]) => { if (!controller.signal.aborted) { setContent(data.items); setProgress(saved); setLoading(false) } })
      .catch((cause: unknown) => { if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Account data unavailable."); setLoading(false) } })
    return () => controller.abort()
  }, [])
  const run = async (operation: () => Promise<void>) => {
    if (running.current) return
    running.current = true; setBusy(true); setError("")
    try { await operation(); setPending(null) } catch (cause) { setError(cause instanceof Error ? cause.message : "Account request failed.") }
    finally { running.current = false; setBusy(false) }
  }
  const change = (operation: () => Promise<void>) => { setPending(() => operation); void run(operation) }
  return <div className="space-y-5">
    <div className="flex justify-between gap-3 items-center"><p>Signed in as {user.email ?? "learner"}</p><Button disabled={busy} onClick={() => void run(async () => { await accountRequest("/auth/sign-out", {}); onSignedOut() })}>Sign out</Button></div>
    <p>Account familiarity: {progress.learnedIds.length}/{content.length}. Saved across devices; familiarity is not mastery.</p>
    <Link className="underline" href="/account/password">Change password</Link>
    {loading && <p role="status">Loading account practice…</p>}
    {error && <div role="alert"><p>{error}</p><Button disabled={busy} onClick={() => { const operation = pending ?? (() => load()); void run(operation) }}>Retry account request</Button></div>}
    {!loading && <>
      <FiltersCard searchTerm={filters.searchTerm} onSearchChange={filters.setSearchTerm} selectedType={filters.selectedType} onTypeChange={filters.setSelectedType} selectedCategory={filters.selectedCategory} onCategoryChange={filters.setSelectedCategory} categories={filters.categories} filteredCount={filters.filteredKana.length} />
      <fieldset disabled={busy || !!pending} className="min-w-0">
        <legend className="text-xl font-semibold">Account flashcards</legend>
        <FlashcardMode filteredKana={filters.filteredKana} isLearned={(id) => progress.learnedIds.includes(id)} onMarkAsLearned={(kanaId) => {
          const save = accountMutation("/me/progress", { kanaId, familiar: true }, "PUT")
          change(async () => { await save(); setProgress(await accountRequest<AccountProgress>("/me/progress")) })
        }} />
      </fieldset>
      <div className="flex flex-wrap gap-2">{(["all", "hiragana", "katakana"] as const).map((type) => <Button key={type} disabled={busy || !!pending} variant="outline" onClick={() => {
        const reset = accountMutation("/me/progress/reset", { type })
        change(async () => { await reset(); setProgress(await accountRequest<AccountProgress>("/me/progress")) })
      }}>Reset {type} familiarity</Button>)}</div>
      <AccountQuizPanel onProgressChanged={() => void run(async () => setProgress(await accountRequest<AccountProgress>("/me/progress")))} />
    </>}
  </div>
}
