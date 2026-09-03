import { getFormattingLocale } from '$lib/locales'
import { getLocale } from '$lib/paraglide/runtime'

export function formatDecimal(value: number | string): string {
  return new Intl.NumberFormat(getFormattingLocale(getLocale()), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function formatDate(
  value: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(
    getFormattingLocale(getLocale()),
    options,
  ).format(value)
}
