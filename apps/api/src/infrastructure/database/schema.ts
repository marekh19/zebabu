import { relations } from 'drizzle-orm'
import { createBudgetPlanningSchema } from '../../modules/budget-planning/schema'
import {
  account,
  accountRelations,
  apikey,
  session,
  sessionRelations,
  user,
  verification,
} from '../../modules/identity/schema'

export {
  account,
  accountRelations,
  apikey,
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
  apikey,
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
