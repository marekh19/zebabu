import { apikey } from '$lib/server/persistence/schema'
import { implement, ORPCError } from '@orpc/server'
import { keysContract } from '@zebabu/api-contract'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { database } from '../lib/server/persistence/database'
import { requireSessionUser, type RequestContext } from '../principal'

const procedures = implement(keysContract).$context<RequestContext>()
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

export const keysRouter = procedures.router({
  list: procedures.list.handler(async ({ context }) => {
    const principal = await requireSessionUser(context)
    const rows = await database
      .select({
        id: apikey.id,
        name: apikey.name,
        permissions: apikey.permissions,
        createdAt: apikey.createdAt,
        expiresAt: apikey.expiresAt,
      })
      .from(apikey)
      .where(eq(apikey.referenceId, principal.id))

    return rows
      .filter((row) => row.name && row.expiresAt)
      .map((row) => ({
        id: row.id,
        name: row.name ?? '',
        scope: storedScope(row.permissions),
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt?.toISOString() ?? '',
      }))
  }),
  create: procedures.create.handler(async ({ context, input }) => {
    const principal = await requireSessionUser(context)
    const created = await context.auth.api.createApiKey({
      body: {
        userId: principal.id,
        name: input.name,
        expiresIn: input.expiresInDays * 24 * 60 * 60,
        permissions: {
          api: input.scope === 'write' ? ['read', 'write'] : ['read'],
        },
      },
    })
    if (!created.expiresAt) throw new ORPCError('INTERNAL_ERROR')
    return {
      id: created.id,
      name: input.name,
      scope: input.scope,
      createdAt: new Date(created.createdAt).toISOString(),
      expiresAt: new Date(created.expiresAt).toISOString(),
      key: created.key,
    }
  }),
  revoke: procedures.revoke.handler(async ({ context, input }) => {
    const principal = await requireSessionUser(context)
    const removed = await database
      .delete(apikey)
      .where(
        and(eq(apikey.id, input.keyId), eq(apikey.referenceId, principal.id)),
      )
      .returning({ id: apikey.id })
    if (removed.length === 0) throw new ORPCError('NOT_FOUND')
    return { success: true }
  }),
})
