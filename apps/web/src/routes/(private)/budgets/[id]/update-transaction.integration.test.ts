import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  updateTransaction: vi.fn(),
}))

vi.mock('$lib/budget-planning/server', () => ({
  addBudgetCategory: vi.fn(),
  createTransaction: vi.fn(),
  deleteBudget: vi.fn(),
  getBudgetDetail: vi.fn(),
  handleDuplicateBudgetAction: vi.fn(),
  updateTransaction: mocks.updateTransaction,
}))

import { actions } from './+page.server'

function request(overrides: Record<string, string> = {}, enhanced = true) {
  return new Request('http://localhost/budgets/budget-1?/updateTransaction', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(enhanced ? { 'x-sveltekit-action': 'true' } : {}),
    },
    body: new URLSearchParams({
      transactionId: 'transaction-1',
      name: 'Updated rent',
      amount: '1300.50',
      isPaid: 'true',
      note: 'Paid by transfer',
      ...overrides,
    }),
  })
}

async function submit(overrides?: Record<string, string>, enhanced = true) {
  const action = actions.updateTransaction
  if (!action) throw new Error('updateTransaction action is not defined')

  return Reflect.apply(action, undefined, [
    {
      request: request(overrides, enhanced),
      params: { id: 'budget-1' },
      locals: { user: { id: 'user-1' } },
    },
  ])
}

describe('updating a transaction', () => {
  beforeEach(() => {
    mocks.updateTransaction.mockReset()
  })

  it('updates every editable field', async () => {
    mocks.updateTransaction.mockResolvedValue({})

    const result = await submit()

    expect(mocks.updateTransaction).toHaveBeenCalledWith(
      'budget-1',
      'user-1',
      'transaction-1',
      expect.objectContaining({
        name: 'Updated rent',
        amount: 1300.5,
        isPaid: true,
        note: 'Paid by transfer',
      }),
    )
    expect(result).toMatchObject({ updateTransactionForm: { valid: true } })
  })

  it('preserves submitted state when validation fails', async () => {
    const result = await submit({ name: ' ', amount: '0' })

    expect(mocks.updateTransaction).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: 400,
      data: {
        updateTransactionForm: {
          valid: false,
          data: { transactionId: 'transaction-1', amount: 0 },
        },
      },
    })
  })

  it.each(['another budget', 'another user'])(
    'does not expose a transaction from %s',
    async () => {
      mocks.updateTransaction.mockResolvedValue({ error: 'not_found' })

      const result = await submit()

      expect(result).toMatchObject({
        status: 404,
        data: {
          updateTransactionError: 'not_found',
          updateTransactionForm: { valid: true },
        },
      })
    },
  )

  it('redirects an unenhanced successful submission to the budget', async () => {
    mocks.updateTransaction.mockResolvedValue({})

    await expect(submit(undefined, false)).rejects.toMatchObject({
      status: 303,
      location: '/budgets/budget-1',
    })
  })
})
