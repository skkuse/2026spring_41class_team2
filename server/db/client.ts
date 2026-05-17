import "server-only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

let dbClient: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (dbClient) {
    return dbClient
  }

  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or POSTGRES_URL is required")
  }

  const client = postgres(databaseUrl, {
    prepare: false,
  })
  dbClient = drizzle(client, { schema })

  return dbClient
}

