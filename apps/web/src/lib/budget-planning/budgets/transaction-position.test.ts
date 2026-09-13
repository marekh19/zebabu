import type { BudgetCategory } from '$lib/budget-planning/model'
import { describe, expect, it } from 'vitest'
import {
  getTransactionPositionCommand,
  moveTransactionByKeyboard,
} from './transaction-position'

const transaction = (id: string) => ({
  id,
  name: id,
  note: null,
  amount: '10.00',
  isPaid: false,
})

const category = (
  id: string,
  transactionIds: readonly string[],
): BudgetCategory => ({
  id,
  category: {
    id,
    name: id,
    type: 'expense',
    color: 'slate',
    defaultAllocationTarget: null,
  },
  transactions: transactionIds.map(transaction),
})

describe('moveTransactionByKeyboard', () => {
  it('keeps vertical movement in the current category and clamps boundaries', () => {
    const categories = [category('left', ['a', 'b']), category('right', ['c'])]
    const moved = moveTransactionByKeyboard(categories, 'b', 'up')

    expect(
      moved.map(({ transactions }) => transactions.map(({ id }) => id)),
    ).toEqual([['b', 'a'], ['c']])
    expect(moveTransactionByKeyboard(moved, 'b', 'up')).toEqual(moved)
  })

  it('moves horizontally to the adjacent category at the nearest index', () => {
    const categories = [
      category('left', ['a', 'b', 'c']),
      category('middle', []),
      category('right', ['d']),
    ]

    const intoEmpty = moveTransactionByKeyboard(categories, 'c', 'right')
    expect(
      intoEmpty.map(({ transactions }) => transactions.map(({ id }) => id)),
    ).toEqual([['a', 'b'], ['c'], ['d']])

    const intoShort = moveTransactionByKeyboard(intoEmpty, 'c', 'right')
    expect(
      intoShort.map(({ transactions }) => transactions.map(({ id }) => id)),
    ).toEqual([['a', 'b'], [], ['c', 'd']])
    expect(moveTransactionByKeyboard(intoShort, 'c', 'right')).toEqual(
      intoShort,
    )
  })
})

describe('getTransactionPositionCommand', () => {
  it('creates the exact server command', () => {
    expect(
      getTransactionPositionCommand(
        { budgetCategoryId: 'source', index: 1 },
        { budgetCategoryId: 'target', index: 2 },
      ),
    ).toEqual({ targetBudgetCategoryId: 'target', targetIndex: 2 })
  })

  it('returns no command for an unchanged or invalid position', () => {
    const location = { budgetCategoryId: 'source', index: 1 }
    expect(getTransactionPositionCommand(location, location)).toBeUndefined()
    expect(getTransactionPositionCommand(undefined, location)).toBeUndefined()
  })
})
