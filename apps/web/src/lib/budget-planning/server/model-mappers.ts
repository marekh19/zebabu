import type {
  CategoryColor,
  CategoryType,
} from '$lib/budget-planning/categories/types'
import type {
  AvailableCategory,
  BudgetDetail,
  BudgetListItem,
  BudgetReference,
  CategoryListItem,
} from '$lib/budget-planning/model'

type PersistedBudget = {
  id: string
  type: 'monthly' | 'scenario'
  name: string | null
  month: number | null
  year: number | null
}

type PersistedBudgetListItem = PersistedBudget & {
  createdAt: Date
}

type PersistedCategory = {
  id: string
  name: string
  type: CategoryType
  color: CategoryColor
}

type PersistedTransaction = {
  id: string
  name: string
  note: string | null
  amount: string
  isPaid: boolean
}

type PersistedBudgetDetail = PersistedBudget & {
  budgetCategories: {
    id: string
    category: PersistedCategory
    transactions: PersistedTransaction[]
  }[]
}

export function toBudgetReference(budget: PersistedBudget): BudgetReference {
  if (
    budget.type === 'monthly' &&
    budget.month !== null &&
    budget.year !== null
  ) {
    return {
      id: budget.id,
      type: budget.type,
      name: null,
      month: budget.month,
      year: budget.year,
    }
  }

  if (budget.type === 'scenario' && budget.name !== null) {
    return {
      id: budget.id,
      type: budget.type,
      name: budget.name,
      month: null,
      year: null,
    }
  }

  throw new Error(`Invalid ${budget.type} budget ${budget.id}`)
}

export function toBudgetListItem(
  budget: PersistedBudgetListItem,
): BudgetListItem {
  return { ...toBudgetReference(budget), createdAt: budget.createdAt }
}

export function toBudgetDetail(budget: PersistedBudgetDetail): BudgetDetail {
  return {
    ...toBudgetReference(budget),
    budgetCategories: budget.budgetCategories.map((placement) => ({
      id: placement.id,
      category: {
        id: placement.category.id,
        name: placement.category.name,
        type: placement.category.type,
        color: placement.category.color,
      },
      transactions: placement.transactions.map((transaction) => ({
        id: transaction.id,
        name: transaction.name,
        note: transaction.note,
        amount: transaction.amount,
        isPaid: transaction.isPaid,
      })),
    })),
  }
}

export function toAvailableCategory(
  category: PersistedCategory,
): AvailableCategory {
  return { id: category.id, name: category.name }
}

export function toCategoryListItem(
  category: PersistedCategory & { budgetUsageCount: number },
): CategoryListItem {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    budgetUsageCount: category.budgetUsageCount,
  }
}
