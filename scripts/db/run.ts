import nextEnv from "@next/env"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { seedKana } from "./seed-kana"
import { migrationTarget } from "./targets"
import * as schema from "../../server/db/schema"

async function main() {
  nextEnv.loadEnvConfig(process.cwd())
  const config = migrationTarget(process.env)
  const connection = postgres(config.url, { max: 1, prepare: false, ssl: config.local ? false : "require", connect_timeout: 10 })
  try {
    const db = drizzle(connection, { schema })
    const action = process.argv[2]
    if (action === "migrate") await migrate(db, { migrationsFolder: "./drizzle" })
    else if (action === "seed") await seedKana(db)
    else throw new Error("Choose migrate or seed")
    console.info(`Database ${action} completed on the explicitly designated target.`)
  } finally { await connection.end() }
}

main().catch(() => { console.error("Database command failed. Check the designated target, credentials and migrations; no connection details are logged."); process.exitCode = 1 })
