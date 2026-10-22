import "server-only"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { databaseUrl } from "../config"
import * as schema from "./schema"
import { assertContentRole, runtimeAccessSql } from "./access"

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
  checkedRole ??= connection!.unsafe<{ rolsuper: boolean; rolbypassrls: boolean; ddl: boolean; unsafe_grants: boolean }[]>(runtimeAccessSql)
    .then((rows) => assertContentRole(rows))
    .catch((error: unknown) => { checkedRole = undefined; throw error })
  await checkedRole
  return database
}
