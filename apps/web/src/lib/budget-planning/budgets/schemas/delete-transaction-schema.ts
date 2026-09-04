import { z } from 'zod'

export const deleteTransactionSchema = z.object({
  transactionId: z.string().min(1),
})
