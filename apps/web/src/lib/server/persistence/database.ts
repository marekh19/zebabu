import { env } from '$env/dynamic/private'
import { drizzle } from 'drizzle-orm/bun-sql'
import { createDatabaseClient } from './database-client'
import { applicationSchema } from './schema'

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set')

export const databaseClient = createDatabaseClient({
  url: env.DATABASE_URL,
  max: env.DB_POOL_SIZE,
  connectionTimeout: env.DB_CONNECTION_TIMEOUT_SECONDS,
  idleTimeout: env.DB_IDLE_TIMEOUT_SECONDS,
  queryTimeout: env.DB_QUERY_TIMEOUT_MS,
})

export const database = drizzle(databaseClient, {
  schema: applicationSchema,
})

export function closeDatabase() {
  return databaseClient.close()
}

let shutdownRegistered = false

export function registerDatabaseShutdown() {
  if (shutdownRegistered) return
  shutdownRegistered = true

  const shutdown = async () => {
    await closeDatabase()
    process.exit(0)
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

export type DbTransaction = Parameters<
  Parameters<typeof database.transaction>[0]
>[0]
