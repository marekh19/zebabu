import { describe, expect, it } from 'vitest'
import { deleteTransactionSchema } from './delete-transaction-schema'

describe('deleteTransactionSchema', () => {
  it.each([undefined, ''])('rejects transactionId %s', (transactionId) => {
    expect(deleteTransactionSchema.safeParse({ transactionId }).success).toBe(
      false,
    )
  })

  it('accepts a transaction identifier', () => {
    expect(
      deleteTransactionSchema.parse({ transactionId: 'transaction-1' }),
    ).toEqual({ transactionId: 'transaction-1' })
  })
})
