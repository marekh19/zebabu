import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createTransaction: vi.fn(),
}))

vi.mock('$lib/server/budgets/service', () => ({
  addBudgetCategory: vi.fn(),
  createTransaction: mocks.createTransaction,
  deleteBudget: vi.fn(),
  getBudgetDetail: vi.fn(),
}))

vi.mock('$lib/server/budgets/action-helpers', () => ({
  handleDuplicateBudgetAction: vi.fn(),
}))

vi.mock('$lib/server/categories/repository', () => ({
  findCategoriesNotInBudget: vi.fn(),
}))

import { actions } from './+page.server'

function request(overrides: Record<string, string> = {}) {
  return new Request('http://localhost/budgets/budget-1?/createTransaction', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      budgetCategoryId: 'budget-category-1',
      name: 'Rent',
      amount: '12500.50',
      ...overrides,
    }),
  })
}

async function submit(overrides?: Record<string, string>) {
  const action = actions.createTransaction
  if (!action) throw new Error('createTransaction action is not defined')

  return Reflect.apply(action, undefined, [
    {
      request: request(overrides),
      params: { id: 'budget-1' },
      locals: { user: { id: 'user-1' } },
    },
  ])
}

describe('creating a transaction', () => {
  beforeEach(() => {
    mocks.createTransaction.mockReset()
  })

  it('creates a valid transaction in the selected budget category', async () => {
    mocks.createTransaction.mockResolvedValue({ transaction: { id: 'tx-1' } })

    const result = await submit()

    expect(mocks.createTransaction).toHaveBeenCalledWith(
      'budget-1',
      'user-1',
      'budget-category-1',
      expect.objectContaining({
        name: 'Rent',
        amount: 12500.5,
        isPaid: false,
      }),
    )
    expect(result).toMatchObject({ createTransactionForm: { valid: true } })
  })

  it('rejects invalid input before calling the service', async () => {
    const result = await submit({ amount: '0' })

    expect(mocks.createTransaction).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: 400,
      data: { createTransactionForm: { valid: false } },
    })
  })

  it('does not expose an unavailable budget category', async () => {
    mocks.createTransaction.mockResolvedValue({ error: 'not_found' })

    const result = await submit()

    expect(result).toMatchObject({
      status: 404,
      data: {
        createTransactionError: 'not_found',
        createTransactionForm: { valid: true },
      },
    })
  })
})
