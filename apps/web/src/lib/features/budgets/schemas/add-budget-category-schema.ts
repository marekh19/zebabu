import { z } from 'zod'

export const addBudgetCategorySchema = z.object({
  categoryId: z.string().min(1),
})
