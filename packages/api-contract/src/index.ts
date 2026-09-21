export {
  budgetAllocationTargetsSchema,
  budgetCategorySchema,
  budgetDetailSchema,
  budgetPageSchema,
  budgetReferenceSchema,
  budgetsContract,
  budgetTargetSchema,
  duplicateBudgetTargetSchema,
  plannedTransactionSchema,
  transactionFieldsSchema,
} from './budgets'
export {
  allocationTargetsSchema,
  categoriesContract,
  categoryColorSchema,
  categorySchema,
  categoryTypeSchema,
} from './categories'
export { keyMetadataSchema, keysContract, keyScopeSchema } from './keys'
export {
  currencySchema,
  profileContract,
  profileSchema,
  updateProfileSchema,
} from './profile'
export type { Profile } from './profile'
export {
  errorCodeSchema,
  errorSchema,
  idSchema,
  moneySchema,
  percentageSchema,
  principalSchema,
  timestampSchema,
} from './schemas'

import { budgetsContract } from './budgets'
import { categoriesContract } from './categories'
import { keysContract } from './keys'
import { profileContract } from './profile'

export const apiContract = {
  profile: profileContract,
  categories: categoriesContract,
  budgets: budgetsContract,
  keys: keysContract,
}
