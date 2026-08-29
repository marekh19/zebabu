import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

export function createDuplicateBudgetSchema() {
  return z
    .object({
      sourceBudgetId: z.string().min(1),
      type: z.enum(['monthly', 'scenario']),
      month: z.coerce.number().min(1).max(12).optional(),
      year: z.coerce.number().min(2000).max(2100).optional(),
      name: z
        .string()
        .max(200, { message: m.budgets_validation_name_max() })
        .optional(),
    })
    .refine(
      (data) =>
        data.type !== 'monthly' || (data.month != null && data.month >= 1),
      {
        message: m.budgets_validation_month_required(),
        path: ['month'],
      },
    )
    .refine(
      (data) =>
        data.type !== 'monthly' || (data.year != null && data.year >= 2000),
      {
        message: m.budgets_validation_year_required(),
        path: ['year'],
      },
    )
    .refine(
      (data) =>
        data.type !== 'scenario' || (data.name != null && data.name.length > 0),
      {
        message: m.budgets_validation_name_required(),
        path: ['name'],
      },
    )
}
