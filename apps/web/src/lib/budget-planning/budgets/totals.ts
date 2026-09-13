import type { CategoryType } from '$lib/budget-planning/categories/types'
import type { BudgetCategory } from '$lib/budget-planning/model'

export function getBudgetCategoryTotal(category: BudgetCategory): number {
  return category.transactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0,
  )
}

export function getBudgetCategoryTypeTotal(
  categories: readonly BudgetCategory[],
  type: CategoryType,
): number {
  return categories
    .filter(({ category }) => category.type === type)
    .reduce((total, category) => total + getBudgetCategoryTotal(category), 0)
}
