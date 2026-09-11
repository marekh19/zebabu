import { describe, expect, it } from 'vitest'
import { positionTransactionIds } from './transaction-rules'

describe('positionTransactionIds', () => {
  it.each([
    [0, ['c', 'a', 'b']],
    [1, ['a', 'c', 'b']],
    [2, ['a', 'b', 'c']],
  ])('moves between categories at index %i', (targetIndex, targetIds) => {
    expect(
      positionTransactionIds(['c'], ['a', 'b'], 'c', targetIndex, false),
    ).toEqual({ sourceIds: [], targetIds })
  })

  it('moves into an empty category and normalizes the source', () => {
    expect(positionTransactionIds(['a', 'b', 'c'], [], 'b', 0, false)).toEqual({
      sourceIds: ['a', 'c'],
      targetIds: ['b'],
    })
  })

  it.each([
    [0, ['c', 'a', 'b']],
    [1, ['a', 'c', 'b']],
    [2, ['a', 'b', 'c']],
  ])('reorders within a category at index %i', (targetIndex, ids) => {
    expect(
      positionTransactionIds(['a', 'b', 'c'], [], 'c', targetIndex, true),
    ).toEqual({ sourceIds: ids, targetIds: ids })
  })

  it('accepts an unchanged position and existing sort-order gaps', () => {
    expect(positionTransactionIds(['a', 'b'], [], 'b', 1, true)).toEqual({
      sourceIds: ['a', 'b'],
      targetIds: ['a', 'b'],
    })
  })

  it('handles a one-item category', () => {
    expect(positionTransactionIds(['a'], [], 'a', 0, true)).toEqual({
      sourceIds: ['a'],
      targetIds: ['a'],
    })
  })

  it.each([-1, 3])('rejects target index %i', (targetIndex) => {
    expect(
      positionTransactionIds(['a'], ['b', 'c'], 'a', targetIndex, false),
    ).toBeUndefined()
  })

  it('rejects a missing transaction', () => {
    expect(
      positionTransactionIds(['a'], ['b'], 'missing', 0, false),
    ).toBeUndefined()
  })
})
