import type { BudgetCategory, Category } from '$lib/budget-planning/model'

export const ALLOCATION_VARIANCE_TOLERANCE_PERCENTAGE_POINTS = 0.1

export const AllocationComparisonState = {
  Under: 'under',
  OnTarget: 'on-target',
  Over: 'over',
} as const

export type AllocationComparisonState =
  (typeof AllocationComparisonState)[keyof typeof AllocationComparisonState]

export type AllocationComparisonRow = Readonly<{
  id: string
  category: Category
  budgetedShare: number
  target: number
  difference: number
  state: AllocationComparisonState
}>

type AllocationComparisonMessages = Readonly<{
  under: (value: string) => string
  onTarget: (value: string) => string
  over: (value: string) => string
  description: (values: {
    category: string
    budgeted: string
    target: string
    status: string
  }) => string
}>

function totalForCategory(category: BudgetCategory): number {
  return category.transactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0,
  )
}

export function getTotalPlannedIncome(
  categories: readonly BudgetCategory[],
): number {
  return categories
    .filter(({ category }) => category.type === 'income')
    .reduce((total, category) => total + totalForCategory(category), 0)
}

export function getAllocationComparisonState(
  difference: number,
): AllocationComparisonState {
  if (Math.abs(difference) < ALLOCATION_VARIANCE_TOLERANCE_PERCENTAGE_POINTS) {
    return AllocationComparisonState.OnTarget
  }
  return difference < 0
    ? AllocationComparisonState.Under
    : AllocationComparisonState.Over
}

export function createAllocationComparisonRows(
  categories: readonly BudgetCategory[],
): AllocationComparisonRow[] {
  const totalIncome = getTotalPlannedIncome(categories)
  if (totalIncome <= 0) return []

  return categories.flatMap((category) => {
    if (
      category.category.type !== 'expense' ||
      category.allocationTarget === null
    ) {
      return []
    }

    const budgetedShare = (totalForCategory(category) / totalIncome) * 100
    const target = Number(category.allocationTarget)
    const difference = budgetedShare - target
    return [
      {
        id: category.id,
        category: category.category,
        budgetedShare,
        target,
        difference,
        state: getAllocationComparisonState(difference),
      },
    ]
  })
}

export function getAllocationChartScale(
  rows: readonly AllocationComparisonRow[],
): number {
  return Math.max(
    100,
    ...rows.flatMap(({ budgetedShare, target }) => [budgetedShare, target]),
  )
}

export function createAllocationComparisonText(
  row: AllocationComparisonRow,
  format: (value: number) => string,
  messages: AllocationComparisonMessages,
): { status: string; description: string } {
  const difference = format(Math.abs(row.difference))
  const status =
    row.state === AllocationComparisonState.Under
      ? messages.under(difference)
      : row.state === AllocationComparisonState.Over
        ? messages.over(difference)
        : messages.onTarget(difference)

  return {
    status,
    description: messages.description({
      category: row.category.name,
      budgeted: format(row.budgetedShare),
      target: format(row.target),
      status,
    }),
  }
}
