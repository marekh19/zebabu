import { describe, expect, it } from 'vitest'
import { getTransactionDeleteFocusId } from './transaction-delete'

const transactions = [{ id: 'first' }, { id: 'selected' }, { id: 'last' }]

describe('getTransactionDeleteFocusId', () => {
  it('prefers the next transaction', () => {
    expect(
      getTransactionDeleteFocusId('category-1', transactions, 'selected'),
    ).toBe('transaction-last')
  })

  it('falls back to the previous transaction', () => {
    expect(
      getTransactionDeleteFocusId('category-1', transactions, 'last'),
    ).toBe('transaction-selected')
  })

  it('falls back to the category add control', () => {
    expect(
      getTransactionDeleteFocusId(
        'category-1',
        [{ id: 'selected' }],
        'selected',
      ),
    ).toBe('add-transaction-category-1')
  })
})
