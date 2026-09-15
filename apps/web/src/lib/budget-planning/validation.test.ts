import { describe, expect, it } from 'vitest'
import {
  allocationTargetsRule,
  budgetInputRule,
  createCategoryRule,
  createTransactionRule,
} from './validation'

describe('transport-neutral domain validation', () => {
  it('validates without localized messages or form parsing', () => {
    expect(
      budgetInputRule.safeParse({
        type: 'monthly',
        month: 9,
        year: 2026,
      }).success,
    ).toBe(true)
    expect(
      createCategoryRule.safeParse({
        name: 'Rent',
        type: 'expense',
        color: 'rose',
      }).success,
    ).toBe(true)
    expect(
      createTransactionRule.safeParse({
        budgetCategoryId: 'category-1',
        name: 'Rent',
        amount: 10.01,
        isPaid: false,
      }).success,
    ).toBe(true)
    expect(
      allocationTargetsRule.safeParse({
        enabled: true,
        targets: [{ categoryId: 'category-1', value: 100 }],
      }).success,
    ).toBe(true)
  })
})
