import {
  currencySchema,
  languageSchema,
  type ProfilePreferences,
} from '$lib/identity'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => {
  const primaryCurrency = currencySchema.safeParse(locals.user?.primaryCurrency)
  const language = languageSchema.safeParse(locals.user?.language)

  const preferences: ProfilePreferences = {
    primaryCurrency: primaryCurrency.success ? primaryCurrency.data : 'CZK',
    language: language.success ? language.data : 'en',
  }

  return { preferences }
}
