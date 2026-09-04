import { applicationSchema } from '$lib/server/persistence/schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set')

export const testConnection = postgres(databaseUrl, { max: 1 })
export const testDatabase = drizzle(testConnection, {
  schema: applicationSchema,
})
