import { describe, expect, it, vi } from 'vitest'
import { updatePrimaryCurrency } from './update-primary-currency'

describe('updatePrimaryCurrency', () => {
  it('reports whether the authenticated update succeeds', async () => {
    const successfulFetch = vi.fn().mockResolvedValue({ ok: true })
    const failedFetch = vi.fn().mockResolvedValue({ ok: false })
    const unavailableFetch = vi.fn().mockRejectedValue(new Error('offline'))

    await expect(updatePrimaryCurrency(successfulFetch, 'CZK')).resolves.toBe(
      true,
    )
    expect(successfulFetch).toHaveBeenCalledWith('/api/auth/update-user', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ primaryCurrency: 'CZK' }),
    })
    await expect(updatePrimaryCurrency(failedFetch, 'EUR')).resolves.toBe(false)
    await expect(updatePrimaryCurrency(unavailableFetch, 'USD')).resolves.toBe(
      false,
    )
  })
})
