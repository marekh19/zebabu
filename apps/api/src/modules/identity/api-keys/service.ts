import { z } from 'zod'
import type { createIdentity } from '../auth/better-auth'
import { deleteApiKey, findApiKeysByUser } from './repository'

const storedPermissionsSchema = z.object({ api: z.array(z.string()) })

function storedScope(permissions: string | null): 'read' | 'write' {
  if (!permissions) return 'read'
  try {
    const parsed = storedPermissionsSchema.safeParse(JSON.parse(permissions))
    return parsed.success && parsed.data.api.includes('write')
      ? 'write'
      : 'read'
  } catch {
    return 'read'
  }
}

export async function listApiKeys(userId: string) {
  const rows = await findApiKeysByUser(userId)
  return rows
    .filter((row) => row.name && row.expiresAt)
    .map((row) => ({
      id: row.id,
      name: row.name ?? '',
      scope: storedScope(row.permissions),
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? '',
    }))
}

export async function issueApiKey(
  auth: ReturnType<typeof createIdentity>,
  userId: string,
  input: { name: string; scope: 'read' | 'write'; expiresInDays: number },
) {
  const created = await auth.api.createApiKey({
    body: {
      userId,
      name: input.name,
      expiresIn: input.expiresInDays * 24 * 60 * 60,
      permissions: {
        api: input.scope === 'write' ? ['read', 'write'] : ['read'],
      },
    },
  })
  if (!created.expiresAt) return null
  return {
    id: created.id,
    name: input.name,
    scope: input.scope,
    createdAt: new Date(created.createdAt).toISOString(),
    expiresAt: new Date(created.expiresAt).toISOString(),
    key: created.key,
  }
}

export function revokeApiKey(userId: string, keyId: string) {
  return deleteApiKey(userId, keyId)
}
