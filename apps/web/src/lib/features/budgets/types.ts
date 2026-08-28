import type {
  budgetCategory,
  category,
  transaction,
} from '$lib/server/db/schema'

export const BudgetType = {
  Monthly: 'monthly',
  Scenario: 'scenario',
} as const

export type BudgetType = (typeof BudgetType)[keyof typeof BudgetType]

export type BudgetCategory = typeof budgetCategory.$inferSelect & {
  category: typeof category.$inferSelect
  transactions: (typeof transaction.$inferSelect)[]
}

export type AvailableCategory = typeof category.$inferSelect
