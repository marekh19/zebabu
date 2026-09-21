import { database } from '#api-database'
import { and, eq } from 'drizzle-orm'
import { apikey } from '../schema'

export function findApiKeysByUser(userId: string) {
  return database
    .select({
      id: apikey.id,
      name: apikey.name,
      permissions: apikey.permissions,
      createdAt: apikey.createdAt,
      expiresAt: apikey.expiresAt,
    })
    .from(apikey)
    .where(eq(apikey.referenceId, userId))
}

export async function deleteApiKey(userId: string, keyId: string) {
  const removed = await database
    .delete(apikey)
    .where(and(eq(apikey.id, keyId), eq(apikey.referenceId, userId)))
    .returning({ id: apikey.id })
  return removed.length > 0
}
