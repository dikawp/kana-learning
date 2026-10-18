"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { accountRequest } from "@/lib/account/client"

export function AuthForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "recover">("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  return <section className="max-w-md space-y-4">
    <h2 className="text-xl font-semibold">{mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Reset password"}</h2>
    <form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault()
      if (busy) return
      setBusy(true); setError(""); setMessage("")
      try {
        const result = await accountRequest<{ message?: string }>(`/auth/${mode}`, mode === "recover" ? { email: email.trim() } : { email: email.trim(), password })
        setPassword("")
        if (mode === "sign-in") onSignedIn()
        else setMessage(result.message ?? "Check your email.")
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Account request failed.") }
      finally { setBusy(false) }
    }}>
      <label htmlFor="account-email">Email</label>
      <Input id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
      {mode !== "recover" && <>
        <label htmlFor="account-password">Password</label>
        <Input id="account-password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
      </>}
      <Button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Send recovery link"}</Button>
    </form>
    <div className="flex flex-wrap gap-2">
      {(["sign-in", "sign-up", "recover"] as const).filter((value) => value !== mode).map((value) => <Button key={value} variant="outline" disabled={busy} onClick={() => { setMode(value); setPassword(""); setMessage(""); setError("") }}>{value === "sign-in" ? "Back to sign in" : value === "sign-up" ? "Create an account" : "Forgot password?"}</Button>)}
    </div>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </section>
}
