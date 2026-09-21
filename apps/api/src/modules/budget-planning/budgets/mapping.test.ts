import { budgetPageSchema } from '@zebabu/api-contract'
import { expect, test } from 'bun:test'
import { toBudgetDetail } from './mapping'

test('restores fixed decimal scales from persisted numeric values', () => {
  const budget = toBudgetDetail({
    id: 'budget-1',
    type: 'monthly',
    name: null,
    month: 8,
    year: 2026,
    budgetCategories: [
      {
        id: 'budget-category-1',
        allocationTarget: '19',
        category: {
          id: 'category-1',
          name: 'Savings',
          type: 'expense',
          color: 'emerald',
          defaultAllocationTarget: '19',
        },
        transactions: [
          {
            id: 'transaction-1',
            name: 'Transfer',
            note: null,
            amount: '130000',
            isPaid: false,
          },
        ],
      },
    ],
  })

  expect(budget.budgetCategories[0]?.allocationTarget).toBe('19.0')
  expect(budget.budgetCategories[0]?.transactions[0]?.amount).toBe('130000.00')
  expect(
    budgetPageSchema.safeParse({ budget, availableCategories: [] }).success,
  ).toBe(true)
})
