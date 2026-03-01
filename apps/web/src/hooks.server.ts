import { building } from '$app/environment'
import { auth } from '$lib/auth'
import { paraglideMiddleware } from '$lib/paraglide/server'
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { svelteKitHandler } from 'better-auth/svelte-kit'

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request

    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace('%paraglide.lang%', locale),
    })
  })

const handleAuth: Handle = async ({ event, resolve }) => {
  const response = await auth.api.getSession({
    headers: event.request.headers,
  })

  event.locals.session = response?.session ?? null
  event.locals.user = response?.user ?? null

  return svelteKitHandler({ event, resolve, auth, building })
}

export const handle: Handle = sequence(handleParaglide, handleAuth)
