import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { budgetsRouter } from './modules/budget-planning/budgets/procedures'
import { categoriesRouter } from './modules/budget-planning/categories/procedures'
import { keysRouter } from './modules/identity/api-keys/procedures'
import { profileRouter } from './modules/identity/users/procedures'

export const router = {
  profile: profileRouter,
  categories: categoriesRouter,
  budgets: budgetsRouter,
  keys: keysRouter,
}

export const apiHandler = new OpenAPIHandler(router)
