import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ updateTransactionPaid: vi.fn() }))

vi.mock('$lib/budget-planning/server', () => ({
  updateTransactionPaid: mocks.updateTransactionPaid,
}))

import { patchTransactionPaid } from './paid-handler'

function request(body: string) {
  return new Request('http://localhost', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

function patch(body: string) {
  return patchTransactionPaid({
    budgetId: 'budget-1',
    transactionId: 'transaction-1',
    userId: 'user-1',
    request: request(body),
  })
}

describe('PATCH transaction paid state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.updateTransactionPaid.mockResolvedValue({})
  })

  it.each([true, false])('persists isPaid=%s', async (isPaid) => {
    const response = await patch(JSON.stringify({ isPaid }))

    expect(response.status).toBe(200)
    expect(mocks.updateTransactionPaid).toHaveBeenCalledWith(
      'budget-1',
      'user-1',
      'transaction-1',
      isPaid,
    )
  })

  it.each(['{}', '{"isPaid":"true"}', 'invalid json'])(
    'rejects malformed input: %s',
    async (body) => {
      const response = await patch(body)

      expect(response.status).toBe(400)
      expect(mocks.updateTransactionPaid).not.toHaveBeenCalled()
    },
  )

  it.each(['another budget', 'another user'])(
    'does not expose a transaction from %s',
    async () => {
      mocks.updateTransactionPaid.mockResolvedValue({ error: 'not_found' })

      const response = await patch('{"isPaid":true}')

      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({
        error: 'Transaction not found',
      })
    },
  )
})
