import * as m from '$lib/paraglide/messages'

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

export function getMonthOptions(): { value: string; label: string }[] {
  return monthTranslations.map((fn, i) => ({
    value: String(i + 1),
    label: fn(),
  }))
}
