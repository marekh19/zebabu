import { describe, expect, it } from 'vitest'
import {
  getFormattingLocale,
  languageSchema,
  profileSchema,
} from './preferences'

describe('languageSchema', () => {
  it.each(['en', 'cs'])('accepts %s', (language) => {
    expect(languageSchema.safeParse(language).success).toBe(true)
  })

  it('rejects unsupported languages', () => {
    expect(languageSchema.safeParse('de').success).toBe(false)
  })
})

describe('profileSchema', () => {
  it('validates both preferences together', () => {
    expect(
      profileSchema.safeParse({ primaryCurrency: 'CZK', language: 'cs' })
        .success,
    ).toBe(true)
    expect(
      profileSchema.safeParse({ primaryCurrency: 'invalid', language: 'cs' })
        .success,
    ).toBe(false)
  })
})

it('maps languages to explicit formatting locales', () => {
  expect(getFormattingLocale('en')).toBe('en-US')
  expect(getFormattingLocale('cs')).toBe('cs-CZ')
})
