import { building } from '$app/environment'
import { readAuthentication } from '$lib/api/auth-session'
import { paraglideMiddleware } from '$lib/paraglide/server'
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request
    event.locals.locale = locale

    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace('%paraglide.lang%', locale),
    })
  })

const handleAuth: Handle = async ({ event, resolve }) => {
  const incomingId = event.request.headers.get('x-request-id')
  event.locals.requestId =
    incomingId && /^[A-Za-z0-9._-]{1,128}$/.test(incomingId)
      ? incomingId
      : crypto.randomUUID()
  if (building || event.url.pathname.startsWith('/health/'))
    return resolve(event)
  const started = performance.now()
  const { user, cookies } = await readAuthentication(event)
  event.locals.user = user
  const response = await resolve(event)
  for (const cookie of cookies) response.headers.append('set-cookie', cookie)
  response.headers.set('x-request-id', event.locals.requestId)
  console.info(
    JSON.stringify({
      event: 'http_request',
      requestId: event.locals.requestId,
      method: event.request.method,
      path: event.url.pathname,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
    }),
  )
  return response
}

export const handle: Handle = sequence(handleParaglide, handleAuth)
