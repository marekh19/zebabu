export const languages = ['en', 'cs'] as const
export type Language = (typeof languages)[number]

export const formattingLocales = {
  en: 'en-US',
  cs: 'cs-CZ',
} as const satisfies Record<Language, string>

export function getFormattingLocale(language: Language): string {
  return formattingLocales[language]
}
