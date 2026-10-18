import type { SupabaseClient, AuthError } from "@supabase/supabase-js"
import { ApiError } from "../api/errors"
import type { Principal } from "../../lib/account/contracts"

export interface AuthGateway {
  user(): Promise<Principal | null>
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  recover(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
  signOut(): Promise<void>
}

export function authFailure(error: AuthError) {
  if (error.status === 429) throw new ApiError(429, "AUTH_RATE_LIMITED", "Please wait before trying again.")
  if (!error.status || error.status >= 500) throw new ApiError(503, "AUTH_UNAVAILABLE", "Account service is temporarily unavailable.")
  throw new ApiError(400, "AUTH_FAILED", "Unable to complete this account action. Check your details or request a new email link.")
}


export function createSupabaseGateway(client: SupabaseClient, origin: string): AuthGateway {
  return {
    async user() {
      const { data, error } = await client.auth.getUser()
      if (error) {
        if (error.name === "AuthSessionMissingError" || error.status === 401 || error.status === 403 || error.status === 400) return null
        authFailure(error)
      }
      return data.user ? { id: data.user.id, email: data.user.email ?? null } : null
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) authFailure(error)
    },
    async signUp(email, password) {
      const { error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/callback?next=/account` } })
      if (error) authFailure(error)
    },
    async recover(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/account/password` })
      if (error) authFailure(error)
    },
    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password })
      if (error) authFailure(error)
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: "local" })
      if (error) authFailure(error)
    },
  }
}
