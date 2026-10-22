import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  // Include dormant declarations to prevent generation of destructive DROP statements.
  schema: ["./server/db/schema.ts", "./drizzle/preserved-schema.ts"],
  out: "./drizzle",
  schemaFilter: ["learning"],
  strict: true,
})
