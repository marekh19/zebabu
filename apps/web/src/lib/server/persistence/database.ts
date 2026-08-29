import { env } from '$env/dynamic/private'
import { drizzle } from 'drizzle-orm/bun-sql'
import { applicationSchema } from './schema'

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set')

export const database = drizzle(env.DATABASE_URL, {
  schema: applicationSchema,
})

export type DbTransaction = Parameters<
  Parameters<typeof database.transaction>[0]
>[0]
