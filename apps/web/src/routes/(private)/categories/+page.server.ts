import { createCreateCategorySchema } from '$lib/features/categories/schemas/create-category-schema'
import {
  createCategory,
  DuplicateCategoryError,
  listCategories,
} from '$lib/server/categories/service'
import { fail } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const categories = await listCategories(ensureDefined(locals.user).id)
  const form = await superValidate(zod4(createCreateCategorySchema()))

  return { categories, form }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(createCreateCategorySchema()),
    )

    if (!form.valid) {
      return fail(400, { form })
    }

    const userId = ensureDefined(locals.user).id

    try {
      await createCategory(userId, form.data)
    } catch (error) {
      if (error instanceof DuplicateCategoryError) {
        return fail(409, { form, error: 'duplicate' as const })
      }
      console.error('Category creation failed:', error)
      return fail(500, { form, error: 'unexpected' as const })
    }

    return { form }
  },
}
