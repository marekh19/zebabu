import { createCreateCategorySchema } from '$lib/features/categories/schemas/create-category-schema'
import { createUpdateCategorySchema } from '$lib/features/categories/schemas/update-category-schema'
import {
  CategoryInUseError,
  CategoryNotFoundError,
  createCategory,
  deleteCategory,
  DuplicateCategoryError,
  LastCategoryOfTypeError,
  listCategories,
  updateCategory,
} from '$lib/server/categories/service'
import { fail } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const categories = await listCategories(ensureDefined(locals.user).id)
  const form = await superValidate(zod4(createCreateCategorySchema()))
  const editForm = await superValidate(zod4(createUpdateCategorySchema()))

  return { categories, form, editForm }
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

  update: async ({ request, locals }) => {
    const editForm = await superValidate(
      request,
      zod4(createUpdateCategorySchema()),
    )

    if (!editForm.valid) {
      return fail(400, { editForm })
    }

    const userId = ensureDefined(locals.user).id
    const { categoryId, name, color } = editForm.data

    try {
      await updateCategory(categoryId, userId, { name, color })
    } catch (error) {
      if (error instanceof DuplicateCategoryError) {
        return fail(409, { editForm, error: 'duplicate' as const })
      }
      if (error instanceof CategoryNotFoundError) {
        return fail(404, { editForm, error: 'not_found' as const })
      }
      console.error('Category update failed:', error)
      return fail(500, { editForm, error: 'unexpected' as const })
    }

    return { editForm }
  },

  delete: async ({ request, locals }) => {
    const data = await request.formData()
    const categoryId = data.get('categoryId')

    if (typeof categoryId !== 'string' || categoryId.length === 0) {
      return fail(400, { error: 'invalid' as const })
    }

    const userId = ensureDefined(locals.user).id

    try {
      await deleteCategory(categoryId, userId)
    } catch (error) {
      if (error instanceof LastCategoryOfTypeError) {
        return fail(409, { error: 'last_of_type' as const })
      }
      if (error instanceof CategoryInUseError) {
        return fail(409, { error: 'in_use' as const })
      }
      if (error instanceof CategoryNotFoundError) {
        return fail(404, { error: 'not_found' as const })
      }
      console.error('Category deletion failed:', error)
      return fail(500, { error: 'unexpected' as const })
    }

    return {}
  },
}
