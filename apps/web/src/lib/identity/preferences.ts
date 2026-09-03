import {
  formattingLocales,
  getFormattingLocale,
  languages,
  type Language,
} from '$lib/locales'
import { z } from 'zod'

export const languageSchema = z.enum(languages)
export { formattingLocales, getFormattingLocale, languages }
export type { Language }

export const currencies = [
  'CZK',
  'EUR',
  'USD',
  'GBP',
  'PLN',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'HUF',
  'RON',
  'BGN',
  'CAD',
  'AUD',
  'JPY',
  'CNY',
] as const
export const currencySchema = z.enum(currencies)
export type Currency = z.infer<typeof currencySchema>

export const profileSchema = z.object({
  primaryCurrency: currencySchema,
  language: languageSchema,
})
export type ProfilePreferences = z.infer<typeof profileSchema>

export function parseLanguage(value: unknown): Language | undefined {
  const result = languageSchema.safeParse(value)
  return result.success ? result.data : undefined
}
