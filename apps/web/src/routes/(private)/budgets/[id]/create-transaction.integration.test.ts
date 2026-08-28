import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createTransaction: vi.fn(),
}))

vi.mock('$lib/budget-planning/server', () => ({
  addBudgetCategory: vi.fn(),
  createTransaction: mocks.createTransaction,
  deleteBudget: vi.fn(),
  getBudgetDetail: vi.fn(),
  handleDuplicateBudgetAction: vi.fn(),
}))

import { actions } from './+page.server'

function request(overrides: Record<string, string> = {}, enhanced = true) {
  return new Request('http://localhost/budgets/budget-1?/createTransaction', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(enhanced ? { 'x-sveltekit-action': 'true' } : {}),
    },
    body: new URLSearchParams({
      budgetCategoryId: 'budget-category-1',
      name: 'Rent',
      amount: '12500.50',
      ...overrides,
    }),
  })
}

async function submit(overrides?: Record<string, string>, enhanced = true) {
  const action = actions.createTransaction
  if (!action) throw new Error('createTransaction action is not defined')

  return Reflect.apply(action, undefined, [
    {
      request: request(overrides, enhanced),
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
    mocks.createTransaction.mockResolvedValue({})

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

  it('redirects an unenhanced successful submission to the budget', async () => {
    mocks.createTransaction.mockResolvedValue({})

    await expect(submit(undefined, false)).rejects.toMatchObject({
      status: 303,
      location: '/budgets/budget-1',
    })
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
