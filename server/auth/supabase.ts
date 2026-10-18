import "server-only"
import { createCookieAuthClient } from "./client"
import { cookies } from "next/headers"
import { authConfig } from "../config"
import { createSupabaseGateway } from "./gateway"
import type { AuthGateway } from "./gateway"

export async function createAuthClient() {
  const config = authConfig()
  const jar = await cookies()
  return createCookieAuthClient(config, {
      getAll: () => jar.getAll(),
      setAll: (values, headers) => {
        for (const { name, value, options } of values) jar.set(name, value, options)
        // Next Route Handlers are always private/no-store; proxy handles refresh headers separately.
        void headers
      },
  }, process.env.NODE_ENV === "production")
}

export async function createAuthGateway(): Promise<AuthGateway> {
  return createSupabaseGateway(await createAuthClient(), authConfig().origin)
}
