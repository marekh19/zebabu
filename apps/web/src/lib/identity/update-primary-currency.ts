import type { CurrencyCode } from './currencies'

type CurrencyUpdateFetch = (
  input: string,
  init: RequestInit,
) => Promise<{ readonly ok: boolean }>

export async function updatePrimaryCurrency(
  fetcher: CurrencyUpdateFetch,
  primaryCurrency: CurrencyCode,
): Promise<boolean> {
  try {
    const response = await fetcher('/api/v1/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ primaryCurrency }),
    })

    return response.ok
  } catch {
    return false
  }
}
