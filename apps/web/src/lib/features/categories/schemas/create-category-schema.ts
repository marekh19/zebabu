import { categoryColors } from '$lib/features/categories/colors'
import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

export function createCreateCategorySchema() {
  return z.object({
    name: z
      .string()
      .min(1, { message: m.categories_validation_name_required() })
      .max(100, { message: m.categories_validation_name_max() }),
    type: z.enum(['income', 'expense']),
    color: z.enum(categoryColors, {
      message: m.categories_validation_color_required(),
    }),
  })
}
