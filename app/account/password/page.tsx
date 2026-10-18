"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { accountRequest } from "@/lib/account/client"

export default function PasswordPage() {
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  return <main className="container mx-auto max-w-md p-6 space-y-4">
    <h1 className="text-2xl font-bold">Choose a new password</h1>
    <p>Open your recovery email link first. A verified account session is required.</p>
    <form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault(); if (busy) return
      setBusy(true); setMessage("")
      try { await accountRequest("/auth/password", { password }); setPassword(""); setMessage("Password updated. You can return to your account.") }
      catch (cause) { setMessage(cause instanceof Error ? cause.message : "Password could not be changed.") }
      finally { setBusy(false) }
    }}>
      <label htmlFor="new-password">New password</label><Input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
      <Button type="submit" disabled={busy}>Update password</Button>
    </form>
    <p role="status">{message}</p><Link href="/account" className="underline">Return to account</Link>
  </main>
}
