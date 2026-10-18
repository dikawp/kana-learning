"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { accountRequest } from "@/lib/account/client"
import type { Principal } from "@/lib/account/contracts"
import { AuthForm } from "./auth-form"
import { AccountDashboard } from "./dashboard"

export function AccountPage({ linkError = false }: { linkError?: boolean }) {
  const [session, setSession] = useState<{ configured: boolean; user: Principal | null } | null>(null)
  const [error, setError] = useState(linkError ? "The account link could not be verified. Request a new link." : "")
  const reload = async (signal?: AbortSignal) => { setSession(await accountRequest("/auth/session", undefined, "GET", signal)); if (!linkError) setError("") }
  useEffect(() => {
    const controller = new AbortController()
    accountRequest<{ configured: boolean; user: Principal | null }>("/auth/session", undefined, "GET", controller.signal)
      .then((value) => { if (!controller.signal.aborted) setSession(value) })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Account service unavailable.") })
    return () => controller.abort()
  }, [])
  return <><Header /><main className="container mx-auto max-w-4xl p-6 space-y-5">
    <h1 className="text-2xl font-bold">Your account</h1>
    <p><Link className="underline" href="/">Guest kana practice</Link> stays independent. Guest progress is never imported into your account.</p>
    {!session && !error && <p role="status">Checking account session…</p>}
    {error && <div role="alert"><p>{error}</p><Button onClick={() => void reload().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Account request failed."))}>Retry session</Button></div>}
    {session?.configured === false && <p role="status">Account services are not configured in this environment. Guest practice is available.</p>}
    {session?.configured && (session.user
      ? <AccountDashboard key={session.user.id} user={session.user} onSignedOut={() => setSession({ configured: true, user: null })} />
      : <AuthForm onSignedIn={() => void reload().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Account session unavailable."))} />)}
  </main></>
}
