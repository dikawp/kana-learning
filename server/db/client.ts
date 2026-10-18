import "server-only"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { databaseUrl } from "../config"
import * as schema from "./schema"
import { ApiError } from "../api/errors"

let connection: ReturnType<typeof postgres> | undefined
let database: ReturnType<typeof drizzle<typeof schema>> | undefined
let checkedRole: Promise<void> | undefined

export async function getDatabase() {
  if (!database) {
    const config = databaseUrl()
    connection = postgres(config.url, {
      max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10, max_lifetime: 600,
      ssl: config.local ? false : "require", connection: { statement_timeout: 10000 },
    })
    database = drizzle(connection, { schema })
  }
  // Fail closed when an owner/admin credential is accidentally used as the runtime connection.
  checkedRole ??= connection!`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`.then((rows) => {
    if (rows.length !== 1 || rows[0].rolsuper || rows[0].rolbypassrls) {
      throw new ApiError(503, "DATABASE_ROLE_UNSAFE", "Account storage requires a restricted runtime role.")
    }
  }).catch((error: unknown) => { checkedRole = undefined; throw error })
  await checkedRole
  return database
}
