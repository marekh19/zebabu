import type { CategoryColor, CategoryType } from './categories/types'

export type BudgetReference =
  | {
      readonly id: string
      readonly type: 'monthly'
      readonly name: null
      readonly month: number
      readonly year: number
    }
  | {
      readonly id: string
      readonly type: 'scenario'
      readonly name: string
      readonly month: null
      readonly year: null
    }

export type BudgetListItem = BudgetReference & {
  readonly createdAt: Date
}

export type PlannedTransaction = {
  readonly id: string
  readonly name: string
  readonly note: string | null
  readonly amount: string
  readonly isPaid: boolean
}

export type Category = {
  readonly id: string
  readonly name: string
  readonly type: CategoryType
  readonly color: CategoryColor
}

export type BudgetCategory = {
  readonly id: string
  readonly category: Category
  readonly transactions: readonly PlannedTransaction[]
}

export type BudgetDetail = BudgetReference & {
  readonly budgetCategories: readonly BudgetCategory[]
}

export type AvailableCategory = Pick<Category, 'id' | 'name'>

export type CategoryListItem = Category & {
  readonly budgetUsageCount: number
}
