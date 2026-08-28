import { describe, expect, it } from 'vitest'
import { createCreateTransactionSchema } from './create-transaction-schema'

const validTransaction = {
  budgetCategoryId: 'budget-category-1',
  name: 'Rent',
  amount: 12.34,
  isPaid: false,
  note: '',
}

describe('create transaction schema', () => {
  const schema = createCreateTransactionSchema()

  it('normalizes valid input', () => {
    expect(
      schema.parse({ ...validTransaction, name: '  Rent  ', note: '  Due  ' }),
    ).toMatchObject({ name: 'Rent', note: 'Due' })
  })

  it.each([
    { field: 'name', value: ' ' },
    { field: 'name', value: 'a'.repeat(201) },
    { field: 'amount', value: 0 },
    { field: 'amount', value: -1 },
    { field: 'amount', value: 1.001 },
    { field: 'amount', value: 10_000_000_000 },
    { field: 'note', value: 'a'.repeat(1001) },
  ])('rejects invalid $field input', ({ field, value }) => {
    expect(
      schema.safeParse({ ...validTransaction, [field]: value }).success,
    ).toBe(false)
  })
})
