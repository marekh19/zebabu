import { categoryColors } from '$lib/features/categories/colors'
import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

export function createUpdateCategorySchema() {
  return z.object({
    categoryId: z.string().min(1),
    name: z
      .string()
      .min(1, { message: m.categories_validation_name_required() })
      .max(100, { message: m.categories_validation_name_max() }),
    color: z.enum(categoryColors, {
      message: m.categories_validation_color_required(),
    }),
  })
}
