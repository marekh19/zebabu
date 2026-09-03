import { describe, expect, it } from 'vitest'
import { load } from './+page.server'

async function loadProfile(primaryCurrency?: string) {
  return Reflect.apply(load, undefined, [
    { locals: { user: { primaryCurrency } } },
  ])
}

describe('profile load', () => {
  it('loads a supported currency and falls back to USD for invalid stored data', async () => {
    await expect(loadProfile('CZK')).resolves.toMatchObject({
      form: { data: { primaryCurrency: 'CZK' } },
    })
    await expect(loadProfile('AUD')).resolves.toMatchObject({
      form: { data: { primaryCurrency: 'USD' } },
    })
  })
})
