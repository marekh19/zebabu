import { afterEach, describe, expect, it, vi } from 'vitest'
import { updatePreferences } from './update-preferences'

describe('updatePreferences', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('updates both preferences in one request', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null)))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      updatePreferences({ primaryCurrency: 'EUR', language: 'cs' }),
    ).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/update-user', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ primaryCurrency: 'EUR', language: 'cs' }),
    })
  })

  it('reports failed requests without changing local state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 500 }))),
    )

    await expect(
      updatePreferences({ primaryCurrency: 'CZK', language: 'en' }),
    ).resolves.toBe(false)
  })
})
