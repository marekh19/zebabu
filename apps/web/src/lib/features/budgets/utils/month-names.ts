import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'

const monthTranslations = [
  m.month_january,
  m.month_february,
  m.month_march,
  m.month_april,
  m.month_may,
  m.month_june,
  m.month_july,
  m.month_august,
  m.month_september,
  m.month_october,
  m.month_november,
  m.month_december,
]

export function getMonthName(month: number): string {
  return monthTranslations[month - 1]()
}

/** Short locale-aware month abbreviation (e.g. "Mar", "bře") via Intl.DateTimeFormat. */
export function getMonthAbbrev(month: number): string {
  return new Intl.DateTimeFormat(getLocale(), { month: 'short' }).format(
    new Date(2000, month - 1),
  )
}

export function getBudgetDisplayName(budget: {
  type: string
  name: string | null
  month: number | null
  year: number | null
}): string {
  if (budget.type === 'monthly' && budget.month && budget.year) {
    return `${getMonthName(budget.month)} ${budget.year}`
  }
  return budget.name ?? ''
}

export function getMonthOptions(): { value: string; label: string }[] {
  return monthTranslations.map((fn, i) => ({
    value: String(i + 1),
    label: fn(),
  }))
}
