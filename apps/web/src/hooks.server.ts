import { building } from '$app/environment'
import { parseLanguage } from '$lib/identity/preferences'
import { cookieName } from '$lib/paraglide/runtime'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { auth } from '$lib/server/application'
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

  const language = parseLanguage(response?.user.language)
  if (language) {
    if (event.cookies.get(cookieName) !== language) {
      event.cookies.set(cookieName, language, {
        path: '/',
        maxAge: 60 * 60 * 24 * 400,
        sameSite: 'lax',
      })
    }

    const headers = new Headers(event.request.headers)
    const cookies = headers.get('cookie') ?? ''
    const languageCookie = `${cookieName}=${language}`
    const nextCookies = cookies
      .split(';')
      .map((cookie) => cookie.trim())
      .filter((cookie) => cookie && !cookie.startsWith(`${cookieName}=`))
      .concat(languageCookie)
      .join('; ')
    headers.set('cookie', nextCookies)
    event.request = new Request(event.request, { headers })
  }

  return svelteKitHandler({ event, resolve, auth, building })
}

export const handle: Handle = sequence(handleAuth, handleParaglide)
