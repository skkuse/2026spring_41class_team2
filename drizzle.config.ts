import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "",
  },
})
