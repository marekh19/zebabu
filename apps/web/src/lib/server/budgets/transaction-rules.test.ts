import { describe, expect, it } from 'vitest'
import {
  isOwnedBudgetCategory,
  nextTransactionSortOrder,
} from './transaction-rules'

describe('transaction creation rules', () => {
  it('rejects a category owned by another user', () => {
    expect(
      isOwnedBudgetCategory({ budget: { userId: 'owner-1' } }, 'user-1'),
    ).toBe(false)
  })

  it('accepts a category owned by the user', () => {
    expect(
      isOwnedBudgetCategory({ budget: { userId: 'user-1' } }, 'user-1'),
    ).toBe(true)
  })

  it('appends after the current final transaction', () => {
    expect(nextTransactionSortOrder({ sortOrder: 4 })).toBe(5)
  })

  it('starts an empty category at zero', () => {
    expect(nextTransactionSortOrder(undefined)).toBe(0)
  })
})
