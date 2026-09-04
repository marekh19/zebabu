import { describe, expect, it } from 'vitest'
import { createCreateTransactionSchema } from './create-transaction-schema'
import { createUpdateTransactionSchema } from './update-transaction-schema'

const editableFields = {
  name: 'Rent',
  amount: 12.34,
  isPaid: false,
  note: '',
}

describe('update transaction schema', () => {
  const createSchema = createCreateTransactionSchema()
  const updateSchema = createUpdateTransactionSchema()

  it('requires a transaction id', () => {
    expect(updateSchema.safeParse(editableFields).success).toBe(false)
  })

  it.each([
    { field: 'name', value: ' ' },
    { field: 'name', value: 'a'.repeat(201) },
    { field: 'amount', value: 0 },
    { field: 'amount', value: 1.001 },
    { field: 'amount', value: 10_000_000_000 },
    { field: 'note', value: 'a'.repeat(1001) },
  ])(
    'matches create validation for invalid $field input',
    ({ field, value }) => {
      const input = { ...editableFields, [field]: value }

      expect(
        updateSchema.safeParse({ transactionId: 'transaction-1', ...input })
          .success,
      ).toBe(
        createSchema.safeParse({ budgetCategoryId: 'category-1', ...input })
          .success,
      )
    },
  )
})
