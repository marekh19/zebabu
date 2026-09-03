import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

export const currencyCodes = [
  'USD',
  'CZK',
  'EUR',
  'GBP',
  'PLN',
  'CHF',
  'CAD',
  'TRY',
  'HUF',
] as const

export const primaryCurrencySchema = z.enum(currencyCodes)

export const profileSchema = z.object({
  primaryCurrency: primaryCurrencySchema,
})

export type CurrencyCode = z.infer<typeof primaryCurrencySchema>

export const currencyLabels: Record<CurrencyCode, () => string> = {
  USD: m.currency_usd,
  CZK: m.currency_czk,
  EUR: m.currency_eur,
  GBP: m.currency_gbp,
  PLN: m.currency_pln,
  CHF: m.currency_chf,
  CAD: m.currency_cad,
  TRY: m.currency_try,
  HUF: m.currency_huf,
}
