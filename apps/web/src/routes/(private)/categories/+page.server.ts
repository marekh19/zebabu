import {
  createAllocationTargetsSchema,
  createCreateCategorySchema,
  createUpdateCategorySchema,
} from '$lib/budget-planning'
import {
  CategoryInUseError,
  CategoryNotFoundError,
  createCategory,
  deleteCategory,
  DuplicateCategoryError,
  InvalidAllocationTargetsError,
  LastCategoryOfTypeError,
  listCategories,
  NonZeroAllocationTargetError,
  saveDefaultAllocationTargets,
  updateCategory,
} from '$lib/budget-planning/server'
import { getAuthenticatedUserId } from '$lib/server/authenticated-user'
import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const categories = await listCategories(getAuthenticatedUserId(locals))
  const form = await superValidate(zod4(createCreateCategorySchema()))
  const editForm = await superValidate(zod4(createUpdateCategorySchema()))
  const expenseCategories = categories.filter(({ type }) => type === 'expense')
  const enabled =
    expenseCategories.length > 0 &&
    expenseCategories.every(
      ({ defaultAllocationTarget }) => defaultAllocationTarget !== null,
    )
  const allocationForm = await superValidate(
    {
      enabled,
      targets: expenseCategories.map(({ id, defaultAllocationTarget }) => ({
        categoryId: id,
        value: enabled
          ? Number(defaultAllocationTarget)
          : expenseCategories.length === 1
            ? 100
            : 0,
      })),
    },
    zod4(createAllocationTargetsSchema()),
  )

  return { categories, form, editForm, allocationForm }
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

    const userId = getAuthenticatedUserId(locals)

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

    const userId = getAuthenticatedUserId(locals)
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

    const userId = getAuthenticatedUserId(locals)

    try {
      await deleteCategory(categoryId, userId)
    } catch (error) {
      if (error instanceof LastCategoryOfTypeError) {
        return fail(409, { error: 'last_of_type' as const })
      }
      if (error instanceof CategoryInUseError) {
        return fail(409, { error: 'in_use' as const })
      }
      if (error instanceof NonZeroAllocationTargetError) {
        return fail(409, { error: 'non_zero_target' as const })
      }
      if (error instanceof CategoryNotFoundError) {
        return fail(404, { error: 'not_found' as const })
      }
      console.error('Category deletion failed:', error)
      return fail(500, { error: 'unexpected' as const })
    }

    return {}
  },

  saveAllocationTargets: async ({ request, locals }) => {
    const allocationForm = await superValidate(
      request,
      zod4(createAllocationTargetsSchema()),
    )

    if (!allocationForm.valid) return fail(400, { allocationForm })

    try {
      await saveDefaultAllocationTargets(
        getAuthenticatedUserId(locals),
        allocationForm.data,
      )
    } catch (error) {
      if (error instanceof InvalidAllocationTargetsError) {
        return fail(400, {
          allocationForm,
          allocationError: 'invalid' as const,
        })
      }
      console.error('Default allocation target update failed:', error)
      return fail(500, {
        allocationForm,
        allocationError: 'unexpected' as const,
      })
    }

    return { allocationForm }
  },
}
