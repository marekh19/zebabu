import * as m from '$lib/paraglide/messages'
import { isKeyOf, isObject, isPropertyOf, isString } from 'narrowland'

export function getActionError<
  const ErrorMessages extends Record<string, () => string>,
>(
  actionData: unknown,
  field: string,
  errorMessages: ErrorMessages,
): keyof ErrorMessages | undefined {
  if (!isObject(actionData)) return undefined

  const hasStringField = isPropertyOf(field, isString)
  if (!hasStringField(actionData)) return undefined
  const value = actionData[field]
  if (!isKeyOf(value, errorMessages)) return undefined

  return value
}

export const addBudgetCategoryErrorMessages = {
  not_found: m.budget_detail_add_category_error_not_found,
  unexpected: m.budget_detail_add_category_error_unexpected,
} as const satisfies Record<string, () => string>

export type AddBudgetCategoryError = keyof typeof addBudgetCategoryErrorMessages

export const createBudgetErrorMessages = {
  duplicate_monthly: m.budgets_error_duplicate,
  duplicate_scenario: m.budgets_error_duplicate_scenario,
  unexpected: m.budgets_error_unexpected,
} as const satisfies Record<string, () => string>

export type CreateBudgetError = keyof typeof createBudgetErrorMessages

export const createTransactionErrorMessages = {
  not_found: m.budget_detail_transaction_error_not_found,
  unexpected: m.budget_detail_transaction_error_unexpected,
} as const satisfies Record<string, () => string>

export type CreateTransactionError = keyof typeof createTransactionErrorMessages

export const updateTransactionErrorMessages = {
  not_found: m.budget_detail_transaction_edit_error_not_found,
  unexpected: m.budget_detail_transaction_error_unexpected,
} as const satisfies Record<string, () => string>

export type UpdateTransactionError = keyof typeof updateTransactionErrorMessages

export const createCategoryErrorMessages = {
  duplicate: m.categories_error_duplicate,
  unexpected: m.categories_error_unexpected,
} as const satisfies Record<string, () => string>

export type CreateCategoryError = keyof typeof createCategoryErrorMessages

export const duplicateBudgetErrorMessages = {
  duplicate_monthly: m.budgets_error_duplicate,
  duplicate_scenario: m.budgets_error_duplicate_scenario,
} as const satisfies Record<string, () => string>

export type DuplicateBudgetError = keyof typeof duplicateBudgetErrorMessages
