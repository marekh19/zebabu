import { describe, expect, it } from 'vitest'
import { toBudgetDetail, toBudgetReference } from './model-mappers'

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

describe('toBudgetDetail', () => {
  it('keeps live Category defaults outside the Budget detail interface', () => {
    const detail = toBudgetDetail({
      id: 'budget-1',
      type: 'scenario',
      name: 'Move',
      month: null,
      year: null,
      budgetCategories: [
        {
          id: 'placement-1',
          allocationTarget: '100.0',
          category: {
            id: 'category-1',
            name: 'Rent',
            type: 'expense',
            color: 'rose',
            defaultAllocationTarget: '80.0',
          },
          transactions: [],
        },
      ],
    })

    expect(detail.budgetCategories[0]?.category).toEqual({
      id: 'category-1',
      name: 'Rent',
      type: 'expense',
      color: 'rose',
    })
  })
})
