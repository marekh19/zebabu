import { describe, expect, it, vi } from 'vitest'

vi.mock('$lib/paraglide/runtime', () => ({
  getLocale: vi.fn(() => 'en'),
}))

import * as runtime from '$lib/paraglide/runtime'
import { formatDecimal } from './utils'

const mockGetLocale = vi.mocked(runtime.getLocale)

describe('formatDecimal', () => {
  describe('with en locale', () => {
    it('formats integer as decimal with 2 fraction digits', () => {
      mockGetLocale.mockReturnValue('en')
      expect(formatDecimal(1000)).toBe('1,000.00')
    })

    it('formats number with existing decimals', () => {
      mockGetLocale.mockReturnValue('en')
      expect(formatDecimal(1234.5)).toBe('1,234.50')
    })

    it('formats number with more than 2 decimals (rounds to 2)', () => {
      mockGetLocale.mockReturnValue('en')
      expect(formatDecimal(1.999)).toBe('2.00')
    })

    it('accepts a string input', () => {
      mockGetLocale.mockReturnValue('en')
      expect(formatDecimal('42.5')).toBe('42.50')
    })

    it('formats zero', () => {
      mockGetLocale.mockReturnValue('en')
      expect(formatDecimal(0)).toBe('0.00')
    })

    it('formats negative numbers', () => {
      mockGetLocale.mockReturnValue('en')
      expect(formatDecimal(-99.9)).toBe('-99.90')
    })
  })

  describe('with cs locale', () => {
    it('uses locale-appropriate separators', () => {
      mockGetLocale.mockReturnValue('cs')
      const result = formatDecimal(1000)
      // Czech locale: space as thousands separator, comma as decimal
      expect(result).toMatch(/1[\s\u00a0\u202f]000,00/)
    })

    it('formats decimal with comma', () => {
      mockGetLocale.mockReturnValue('cs')
      const result = formatDecimal(1.5)
      expect(result).toBe('1,50')
    })
  })
})
