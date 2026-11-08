import { drizzle } from 'drizzle-orm/bun-sql'
import { createDatabaseClient } from './client'
import { applicationSchema } from './schema'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')

export const databaseClient = createDatabaseClient({
  url: process.env.DATABASE_URL,
  max: process.env.DB_POOL_SIZE,
  connectionTimeout: process.env.DB_CONNECTION_TIMEOUT_SECONDS,
  idleTimeout: process.env.DB_IDLE_TIMEOUT_SECONDS,
  queryTimeout: process.env.DB_QUERY_TIMEOUT_MS,
})

export const database = drizzle(databaseClient, {
  schema: applicationSchema,
})

export function closeDatabase() {
  return databaseClient.close()
}

export type DbTransaction = Parameters<
  Parameters<typeof database.transaction>[0]
>[0]
