import * as m from '$lib/paraglide/messages'
import { CategoryType } from './types'

export const categoryTypeLabels = {
  [CategoryType.Income]: m.categories_type_income,
  [CategoryType.Expense]: m.categories_type_expense,
} as const satisfies Record<CategoryType, () => string>
