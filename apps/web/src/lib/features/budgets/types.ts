import type {
  budgetCategory,
  category,
  transaction,
} from '$lib/server/db/schema'

export type BudgetCategory = typeof budgetCategory.$inferSelect & {
  category: typeof category.$inferSelect
  transactions: (typeof transaction.$inferSelect)[]
}
