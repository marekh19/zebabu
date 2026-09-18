import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { budgetsRouter } from './routes/budgets'
import { categoriesRouter } from './routes/categories'
import { keysRouter } from './routes/keys'
import { profileRouter } from './routes/profile'

export const router = {
  profile: profileRouter,
  categories: categoriesRouter,
  budgets: budgetsRouter,
  keys: keysRouter,
}

export const apiHandler = new OpenAPIHandler(router)
