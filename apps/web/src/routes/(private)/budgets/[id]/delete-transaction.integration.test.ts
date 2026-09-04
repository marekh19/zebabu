import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteTransaction: vi.fn(),
}))

vi.mock('$lib/budget-planning/server', () => ({
  addBudgetCategory: vi.fn(),
  createTransaction: vi.fn(),
  deleteBudget: vi.fn(),
  deleteTransaction: mocks.deleteTransaction,
  getBudgetDetail: vi.fn(),
  handleDuplicateBudgetAction: vi.fn(),
  updateTransaction: vi.fn(),
}))

import { actions } from './+page.server'

function request(transactionId = 'transaction-1', enhanced = true) {
  return new Request('http://localhost/budgets/budget-1?/deleteTransaction', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(enhanced ? { 'x-sveltekit-action': 'true' } : {}),
    },
    body: new URLSearchParams({ transactionId }),
  })
}

async function submit(transactionId?: string, enhanced = true) {
  const action = actions.deleteTransaction
  if (!action) throw new Error('deleteTransaction action is not defined')

  return Reflect.apply(action, undefined, [
    {
      request: request(transactionId, enhanced),
      params: { id: 'budget-1' },
      locals: { user: { id: 'user-1' } },
    },
  ])
}

describe('deleting a transaction', () => {
  beforeEach(() => {
    mocks.deleteTransaction.mockReset()
  })

  it('deletes from the owned route budget', async () => {
    mocks.deleteTransaction.mockResolvedValue({})

    await expect(submit()).resolves.toEqual({})
    expect(mocks.deleteTransaction).toHaveBeenCalledWith(
      'budget-1',
      'user-1',
      'transaction-1',
    )
  })

  it('rejects an empty transaction identifier', async () => {
    const result = await submit('')

    expect(result).toMatchObject({ status: 400 })
    expect(mocks.deleteTransaction).not.toHaveBeenCalled()
  })

  it('conceals a missing or inaccessible transaction', async () => {
    mocks.deleteTransaction.mockResolvedValue({ error: 'not_found' })

    const result = await submit()

    expect(result).toMatchObject({
      status: 404,
      data: { deleteTransactionError: 'not_found' },
    })
  })

  it('reports an unexpected service failure', async () => {
    mocks.deleteTransaction.mockRejectedValue(new Error('database unavailable'))
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = await submit()
    consoleError.mockRestore()

    expect(result).toMatchObject({
      status: 500,
      data: { deleteTransactionError: 'unexpected' },
    })
  })

  it('redirects an unenhanced successful submission to the budget', async () => {
    mocks.deleteTransaction.mockResolvedValue({})

    await expect(submit(undefined, false)).rejects.toMatchObject({
      status: 303,
      location: '/budgets/budget-1',
    })
  })
})
