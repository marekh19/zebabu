import { getLocale } from '$lib/paraglide/runtime'

export function formatDecimal(value: number | string): string {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}
