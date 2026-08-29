import { createBudgetPlanningSchema } from '$lib/budget-planning/server/persistence/schema'
import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  verification,
} from '$lib/identity/server/persistence/schema'
import { relations } from 'drizzle-orm'

export {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  verification,
}

export const budgetPlanningSchema = createBudgetPlanningSchema(user)

export const {
  budgetTypeEnum,
  categoryTypeEnum,
  categoryColorEnum,
  budget,
  category,
  budgetCategory,
  transaction,
  budgetRelations,
  categoryRelations,
  budgetCategoryRelations,
  transactionRelations,
} = budgetPlanningSchema

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  budgets: many(budget),
  categories: many(category),
}))

export const applicationSchema = {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
  budgetTypeEnum,
  categoryTypeEnum,
  categoryColorEnum,
  budget,
  category,
  budgetCategory,
  transaction,
  budgetRelations,
  categoryRelations,
  budgetCategoryRelations,
  transactionRelations,
}
