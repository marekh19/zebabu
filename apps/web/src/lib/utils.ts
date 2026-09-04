import { getFormattingLocale } from '$lib/formatting-locale'

export function formatDecimal(value: number | string): string {
  return new Intl.NumberFormat(getFormattingLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(getFormattingLocale(), {
    dateStyle: 'medium',
  }).format(date)
}

export function formatMonthAbbrev(month: number): string {
  return new Intl.DateTimeFormat(getFormattingLocale(), {
    month: 'short',
  }).format(new Date(2000, month - 1))
}
