const MAX_YEARS_ABOVE_CURRENT = 5
const MIN_YEAR = 2000

export function getYearOptions(): readonly { value: string; label: string }[] {
  const currentYear = new Date().getFullYear()
  const years: { value: string; label: string }[] = []
  for (let y = currentYear + MAX_YEARS_ABOVE_CURRENT; y >= MIN_YEAR; y--) {
    years.push({ value: String(y), label: String(y) })
  }
  return years
}
