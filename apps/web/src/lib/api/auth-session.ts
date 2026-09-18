import { env } from '$env/dynamic/private'
import type { RequestEvent } from '@sveltejs/kit'
import { profileSchema } from '@zebabu/api-contract'
import { z } from 'zod'

const sessionResponseSchema = z.object({
  user: z.object(profileSchema.shape),
})

export async function readAuthentication(event: RequestEvent) {
  if (!env.API_INTERNAL_URL) throw new Error('API_INTERNAL_URL is not set')
  const response = await fetch(
    new URL('/api/auth/get-session', env.API_INTERNAL_URL),
    {
      headers: {
        cookie: event.request.headers.get('cookie') ?? '',
        origin: event.request.headers.get('origin') ?? event.url.origin,
        'x-request-id': event.locals.requestId,
      },
    },
  )
  if (!response.ok)
    throw new Error(`Authentication service returned ${response.status}`)
  const body: unknown = await response.json()
  if (body === null)
    return { user: null, cookies: response.headers.getSetCookie() }
  const parsed = sessionResponseSchema.safeParse(body)
  if (!parsed.success)
    throw new Error('Authentication service returned an invalid Session')
  return { user: parsed.data.user, cookies: response.headers.getSetCookie() }
}
