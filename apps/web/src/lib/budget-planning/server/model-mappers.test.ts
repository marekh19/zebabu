import { describe, expect, it } from 'vitest'
import { toBudgetReference } from './model-mappers'

describe('toBudgetReference', () => {
  it('rejects a monthly budget without its calendar period', () => {
    expect(() =>
      toBudgetReference({
        id: 'budget-1',
        type: 'monthly',
        name: null,
        month: null,
        year: 2026,
      }),
    ).toThrow('Invalid monthly budget budget-1')
  })
})
