import { ORPCError } from '@orpc/server'
import type { createIdentity } from './lib/identity/server/create-identity'
import { ensureUserProvisioned } from './lib/identity/server/provisioning'

export type SessionResult = ReturnType<
  ReturnType<typeof createIdentity>['api']['getSession']
>

export type RequestContext = Readonly<{
  session: SessionResult
  apiKey: Promise<
    | { userId: string; keyId: string; allowed: boolean; rateLimited?: false }
    | { rateLimited: true }
    | null
  >
  auth: ReturnType<typeof createIdentity>
  locale: 'en' | 'cs'
}>

export async function requireUser(context: RequestContext) {
  const result = await context.session
  if (result) {
    await ensureUserProvisioned(result.user.id, context.locale)
    return result.user
  }

  const key = await context.apiKey
  if (key?.rateLimited) throw new ORPCError('RATE_LIMITED', { status: 429 })
  if (!key) throw new ORPCError('UNAUTHORIZED')
  if (!key.allowed) throw new ORPCError('FORBIDDEN')
  await ensureUserProvisioned(key.userId, context.locale)
  return { id: key.userId }
}

export async function requireSessionUser(context: RequestContext) {
  const result = await context.session
  if (!result) throw new ORPCError('UNAUTHORIZED')
  await ensureUserProvisioned(result.user.id, context.locale)
  return result.user
}

export async function resolveApiKey(
  auth: ReturnType<typeof createIdentity>,
  token: string,
  method: string,
  requestId: string,
) {
  const result = await auth.api.verifyApiKey({ body: { key: token } })
  if (!result.valid || !result.key)
    return result.error?.code === 'RATE_LIMITED'
      ? { rateLimited: true as const }
      : null

  const permission = ['GET', 'HEAD'].includes(method) ? 'read' : 'write'
  const allowed = result.key.permissions?.api?.includes(permission) ?? false
  console.info(
    JSON.stringify({
      event: 'api_key_auth',
      requestId,
      keyId: result.key.id,
      allowed,
    }),
  )
  return {
    userId: result.key.referenceId,
    keyId: result.key.id,
    allowed,
  }
}

export function requestLocale(headers: Headers): 'en' | 'cs' {
  const language = headers.get('accept-language')?.toLowerCase() ?? ''
  return language.startsWith('cs') ? 'cs' : 'en'
}
