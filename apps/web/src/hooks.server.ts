import { building } from '$app/environment'
import { ensureUserProvisioned } from '$lib/identity/server'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { auth } from '$lib/server/application'
import { registerDatabaseShutdown } from '$lib/server/persistence/database'
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { svelteKitHandler } from 'better-auth/svelte-kit'

if (!building) registerDatabaseShutdown()

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
  const response = await auth.api.getSession({
    headers: event.request.headers,
  })

  event.locals.session = response?.session ?? null
  event.locals.user = response?.user ?? null

  if (response) {
    await ensureUserProvisioned(response.user.id, event.locals.locale)
  }

  return svelteKitHandler({ event, resolve, auth, building })
}

export const handle: Handle = sequence(handleParaglide, handleAuth)
