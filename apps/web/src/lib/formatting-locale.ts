import { getLocale } from '$lib/paraglide/runtime'

export const formattingLocales = {
  en: 'en-US',
  cs: 'cs-CZ',
} as const satisfies Record<ReturnType<typeof getLocale>, string>

export function getFormattingLocale(): string {
  return formattingLocales[getLocale()]
}
