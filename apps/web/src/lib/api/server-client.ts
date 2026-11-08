import { env } from '$env/dynamic/private'
import type { RequestEvent } from '@sveltejs/kit'
import { createApiClient } from './client'
export { apiErrorCode } from './client'

export function createServerApiClient(event: RequestEvent) {
  if (!env.API_INTERNAL_URL) throw new Error('API_INTERNAL_URL is not set')

  return createApiClient(env.API_INTERNAL_URL, () => ({
    cookie: event.request.headers.get('cookie') ?? '',
    origin: event.request.headers.get('origin') ?? event.url.origin,
    'x-request-id': event.locals.requestId,
    'accept-language': event.locals.locale,
  }))
}
