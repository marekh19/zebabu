import { resolve } from '$app/paths'
import { currencySchema, languageSchema } from '$lib/identity'
import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user || !locals.session) {
    redirect(302, resolve('/auth/login'))
  }

  const primaryCurrency = currencySchema.safeParse(locals.user.primaryCurrency)
  const language = languageSchema.safeParse(locals.user.language)

  return {
    user: locals.user,
    session: locals.session,
    preferences: {
      primaryCurrency: primaryCurrency.success ? primaryCurrency.data : 'CZK',
      language: language.success ? language.data : 'en',
    },
  }
}
