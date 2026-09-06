import { describe, expect, it } from 'vitest'
import {
  getTransactionBoardSnapClass,
  transactionCollisionPriority,
} from './transaction-drag-behavior'

describe('transaction drag behavior', () => {
  it('disables mobile scroll snapping while a transaction is dragging', () => {
    expect(getTransactionBoardSnapClass(true)).toBe('snap-none')
    expect(getTransactionBoardSnapClass(false)).toBe(
      'snap-x snap-mandatory sm:snap-none',
    )
  })

  it('prefers a transaction row over its containing category drop zone', () => {
    expect(transactionCollisionPriority.item).toBeGreaterThan(
      transactionCollisionPriority.group,
    )
  })
})
