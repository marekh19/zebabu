import { z } from 'zod'
import { createTransactionFields } from './create-transaction-schema'

export function createUpdateTransactionSchema() {
  return z.object({
    transactionId: z.string().min(1),
    ...createTransactionFields(),
  })
}

export type UpdateTransactionSchema = ReturnType<
  typeof createUpdateTransactionSchema
>
