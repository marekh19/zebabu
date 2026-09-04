import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

const MAX_AMOUNT = 9_999_999_999.99

export function createTransactionFields() {
  return {
    name: z
      .string()
      .trim()
      .min(1, {
        message: m.budget_detail_transaction_validation_name_required(),
      })
      .max(200, { message: m.budget_detail_transaction_validation_name_max() }),
    amount: z
      .number({
        message: m.budget_detail_transaction_validation_amount_required(),
      })
      .positive({
        message: m.budget_detail_transaction_validation_amount_positive(),
      })
      .max(MAX_AMOUNT, {
        message: m.budget_detail_transaction_validation_amount_max(),
      })
      .multipleOf(0.01, {
        message: m.budget_detail_transaction_validation_amount_precision(),
      }),
    isPaid: z.boolean().default(false),
    note: z
      .string()
      .trim()
      .max(1000, { message: m.budget_detail_transaction_validation_note_max() })
      .optional(),
  }
}

export function createCreateTransactionSchema() {
  return z.object({
    budgetCategoryId: z.string().min(1),
    ...createTransactionFields(),
  })
}
