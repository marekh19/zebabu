import type { BudgetCategory } from '$lib/budget-planning/model'
import { describe, expect, it, vi } from 'vitest'
import {
  commitTransactionPosition,
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
  category: { id, name: id, type: 'expense', color: 'slate' },
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

describe('commitTransactionPosition', () => {
  it('locks dragging through persistence and refresh', async () => {
    const onBusyChange = vi.fn()
    const persist = vi.fn(async () => {
      expect(onBusyChange).toHaveBeenLastCalledWith(true)
      return new Response(null, { status: 200 })
    })
    const refresh = vi.fn(async () => {
      expect(onBusyChange).toHaveBeenLastCalledWith(true)
    })

    await expect(
      commitTransactionPosition({
        persist,
        refresh,
        onBusyChange,
        onRollback: vi.fn(),
        onError: vi.fn(),
        onSettled: vi.fn(),
      }),
    ).resolves.toBe(true)
    expect(persist).toHaveBeenCalledOnce()
    expect(refresh).toHaveBeenCalledOnce()
    expect(onBusyChange).toHaveBeenNthCalledWith(1, true)
    expect(onBusyChange).toHaveBeenNthCalledWith(2, false)
  })

  it('rolls back once and unlocks after a failed request', async () => {
    const onRollback = vi.fn()
    const onError = vi.fn()
    const onBusyChange = vi.fn()
    const onSettled = vi.fn()

    await expect(
      commitTransactionPosition({
        persist: async () => new Response(null, { status: 500 }),
        refresh: vi.fn(),
        onBusyChange,
        onRollback,
        onError,
        onSettled,
      }),
    ).resolves.toBe(false)
    expect(onRollback).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalledOnce()
    expect(onBusyChange).toHaveBeenNthCalledWith(1, true)
    expect(onBusyChange).toHaveBeenNthCalledWith(2, false)
  })

  it('keeps a confirmed move when refresh fails', async () => {
    const onRollback = vi.fn()
    const onError = vi.fn()

    await expect(
      commitTransactionPosition({
        persist: async () => new Response(null, { status: 200 }),
        refresh: async () => {
          throw new Error('Refresh failed')
        },
        onBusyChange: vi.fn(),
        onRollback,
        onError,
        onSettled: vi.fn(),
      }),
    ).resolves.toBe(true)
    expect(onRollback).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
