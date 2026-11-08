import { describe, expect, test } from 'bun:test'
import {
  allocationTargetsSchema,
  categoriesContract,
  categorySchema,
  errorSchema,
  moneySchema,
  percentageSchema,
  timestampSchema,
  updateProfileSchema,
} from './index'

describe('wire values', () => {
  test('accepts canonical decimal strings without number conversion', () => {
    expect(moneySchema.safeParse('9999999999.99').success).toBe(true)
    expect(percentageSchema.safeParse('100.0').success).toBe(true)
    for (const value of ['01.00', '1', '1.001', '-1.00']) {
      expect(moneySchema.safeParse(value).success).toBe(false)
    }
    for (const value of ['100.1', '1.00', '-0.1']) {
      expect(percentageSchema.safeParse(value).success).toBe(false)
    }
    expect(timestampSchema.safeParse('2026-09-17T10:00:00.000Z').success).toBe(
      true,
    )
    expect(timestampSchema.safeParse('2026-09-17').success).toBe(false)
  })

  test('rejects unknown transport fields and invalid ownership input', () => {
    expect(
      categorySchema.safeParse({
        id: 'c1',
        name: 'Food',
        type: 'expense',
        color: 'rose',
        defaultAllocationTarget: null,
        budgetUsageCount: 0,
        userId: 'u1',
      }).success,
    ).toBe(false)
    expect(
      updateProfileSchema.safeParse({ primaryCurrency: 'USD', userId: 'u1' })
        .success,
    ).toBe(false)
    expect(
      allocationTargetsSchema.safeParse({
        enabled: true,
        targets: [{ categoryId: 'c1', value: '100.0' }],
      }).success,
    ).toBe(true)
    expect(
      errorSchema.safeParse({ code: 'NOT_FOUND', requestId: 'req-1' }).success,
    ).toBe(true)
  })

  test('declares the first Profile and Category routes', () => {
    expect(
      Object.values(categoriesContract).map(
        (operation) => operation['~orpc'].route.path,
      ),
    ).toEqual([
      '/api/v1/categories',
      '/api/v1/categories',
      '/api/v1/categories/{categoryId}',
      '/api/v1/categories/{categoryId}',
      '/api/v1/categories/allocation-targets',
    ])
  })
})
