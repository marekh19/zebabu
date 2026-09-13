import type { BudgetCategory } from '$lib/budget-planning/model'
import { describe, expect, it } from 'vitest'
import {
  AllocationComparisonState,
  createAllocationComparisonRows,
  createAllocationComparisonText,
  getAllocationChartScale,
  getAllocationComparisonState,
  getTotalPlannedIncome,
} from './comparison'

function category(
  id: string,
  type: 'income' | 'expense',
  amount: number,
  allocationTarget: string | null = null,
  isPaid = false,
): BudgetCategory {
  return {
    id,
    allocationTarget,
    category: {
      id: `category-${id}`,
      name: id,
      type,
      color: id === 'food' ? 'amber' : 'slate',
    },
    transactions: [
      {
        id: `transaction-${id}`,
        name: id,
        note: null,
        amount: amount.toFixed(2),
        isPaid,
      },
    ],
  }
}

describe('allocation comparison calculations', () => {
  it('returns no rows when planned income is zero', () => {
    expect(
      createAllocationComparisonRows([
        category('income', 'income', 0),
        category('rent', 'expense', 100, '100.0'),
      ]),
    ).toEqual([])
  })

  it('ignores paid state when calculating planned income and shares', () => {
    const categories = [
      category('income-paid', 'income', 500, null, true),
      category('income-unpaid', 'income', 500),
      category('rent', 'expense', 250, '25.0', true),
    ]

    expect(getTotalPlannedIncome(categories)).toBe(1000)
    expect(createAllocationComparisonRows(categories)[0]?.budgetedShare).toBe(
      25,
    )
  })

  it.each([
    [-0.1, AllocationComparisonState.Under],
    [-0.099, AllocationComparisonState.OnTarget],
    [0, AllocationComparisonState.OnTarget],
    [0.099, AllocationComparisonState.OnTarget],
    [0.1, AllocationComparisonState.Over],
  ])('classifies tolerance boundary %s', (difference, state) => {
    expect(getAllocationComparisonState(difference)).toBe(state)
  })

  it.each([
    [999, '100.0', AllocationComparisonState.Under],
    [1000, '99.9', AllocationComparisonState.Over],
  ])(
    'classifies calculated tolerance boundary for %s against %s',
    (amount, target, state) => {
      const rows = createAllocationComparisonRows([
        category('income', 'income', 1000),
        category('expense', 'expense', amount, target),
      ])

      expect(rows[0]?.state).toBe(state)
    },
  )

  it('preserves expense BudgetCategory order and Category presentation data', () => {
    const rows = createAllocationComparisonRows([
      category('income', 'income', 1000),
      category('food', 'expense', 300, '25.0'),
      category('rent', 'expense', 500, '50.0'),
    ])

    expect(
      rows.map(({ id, category, state }) => ({
        id,
        name: category.name,
        color: category.color,
        state,
      })),
    ).toEqual([
      { id: 'food', name: 'food', color: 'amber', state: 'over' },
      { id: 'rent', name: 'rent', color: 'slate', state: 'on-target' },
    ])
  })

  it('extends one shared scale beyond 100 without capping values', () => {
    const rows = createAllocationComparisonRows([
      category('income', 'income', 100),
      category('rent', 'expense', 125, '80.0'),
    ])

    expect(rows[0]?.budgetedShare).toBe(125)
    expect(getAllocationChartScale(rows)).toBe(125)
  })

  it('builds state labels and accessible descriptions from row values', () => {
    const row = createAllocationComparisonRows([
      category('income', 'income', 1000),
      category('food', 'expense', 320, '30.0'),
    ])[0]
    if (!row) throw new Error('comparison row is missing')

    expect(
      createAllocationComparisonText(row, (value) => value.toFixed(1), {
        under: (value) => `${value} pp under`,
        onTarget: (value) => `${value} pp on target`,
        over: (value) => `${value} pp over`,
        description: ({ category, budgeted, target, status }) =>
          `${category}: ${budgeted}% budgeted, ${target}% target, ${status}`,
      }),
    ).toEqual({
      status: '2.0 pp over',
      description: 'food: 32.0% budgeted, 30.0% target, 2.0 pp over',
    })
  })
})
