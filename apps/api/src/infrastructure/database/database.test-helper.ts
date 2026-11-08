import { drizzle } from 'drizzle-orm/bun-sql'
import { createDatabaseClient } from './client'
import { applicationSchema } from './schema'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set')

export const testConnection = createDatabaseClient({
  url: databaseUrl,
  max: 4,
  connectionTimeout: 10,
  idleTimeout: 10,
  queryTimeout: 10_000,
})
export const testDatabase = drizzle(testConnection, {
  schema: applicationSchema,
})
