import { updateTransactionRule } from '$lib/budget-planning/validation'
import { z } from 'zod'
import { createTransactionFields } from './create-transaction-schema'

export function createUpdateTransactionSchema() {
  return z
    .object({
      transactionId: z.string().min(1),
      ...createTransactionFields(),
    })
    .pipe(updateTransactionRule)
}

export type UpdateTransactionSchema = ReturnType<
  typeof createUpdateTransactionSchema
>
