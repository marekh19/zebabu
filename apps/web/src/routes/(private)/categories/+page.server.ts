import { apiErrorCode, createServerApiClient } from '$lib/api/server-client'
import {
  areDefaultAllocationTargetsEnabled,
  createAllocationTargetsSchema,
  createCreateCategorySchema,
  createUpdateCategorySchema,
} from '$lib/budget-planning'
import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  const categories = await createServerApiClient(event).categories.list()
  const form = await superValidate(zod4(createCreateCategorySchema()))
  const editForm = await superValidate(zod4(createUpdateCategorySchema()))
  const expenseCategories = categories.filter(({ type }) => type === 'expense')
  const enabled = areDefaultAllocationTargetsEnabled(expenseCategories)
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
  create: async (event) => {
    const { request } = event
    const form = await superValidate(
      request,
      zod4(createCreateCategorySchema()),
    )

    if (!form.valid) {
      return fail(400, { form })
    }

    try {
      await createServerApiClient(event).categories.create(form.data)
    } catch (error) {
      if (apiErrorCode(error) === 'CONFLICT') {
        return fail(409, { form, error: 'duplicate' as const })
      }
      console.error('Category creation failed:', error)
      return fail(500, { form, error: 'unexpected' as const })
    }

    return { form }
  },

  update: async (event) => {
    const { request } = event
    const editForm = await superValidate(
      request,
      zod4(createUpdateCategorySchema()),
    )

    if (!editForm.valid) {
      return fail(400, { editForm })
    }

    const { categoryId, name, color } = editForm.data

    try {
      await createServerApiClient(event).categories.update({
        categoryId,
        name,
        color,
      })
    } catch (error) {
      if (apiErrorCode(error) === 'CONFLICT') {
        return fail(409, { editForm, error: 'duplicate' as const })
      }
      if (apiErrorCode(error) === 'NOT_FOUND') {
        return fail(404, { editForm, error: 'not_found' as const })
      }
      console.error('Category update failed:', error)
      return fail(500, { editForm, error: 'unexpected' as const })
    }

    return { editForm }
  },

  delete: async (event) => {
    const { request } = event
    const data = await request.formData()
    const categoryId = data.get('categoryId')

    if (typeof categoryId !== 'string' || categoryId.length === 0) {
      return fail(400, { error: 'invalid' as const })
    }

    try {
      await createServerApiClient(event).categories.delete({ categoryId })
    } catch (error) {
      if (apiErrorCode(error) === 'LAST_CATEGORY_OF_TYPE') {
        return fail(409, { error: 'last_of_type' as const })
      }
      if (apiErrorCode(error) === 'CATEGORY_IN_USE') {
        return fail(409, { error: 'in_use' as const })
      }
      if (apiErrorCode(error) === 'NON_ZERO_ALLOCATION_TARGET') {
        return fail(409, { error: 'non_zero_target' as const })
      }
      if (apiErrorCode(error) === 'NOT_FOUND') {
        return fail(404, { error: 'not_found' as const })
      }
      console.error('Category deletion failed:', error)
      return fail(500, { error: 'unexpected' as const })
    }

    return {}
  },

  saveAllocationTargets: async (event) => {
    const { request } = event
    const allocationForm = await superValidate(
      request,
      zod4(createAllocationTargetsSchema()),
    )

    if (!allocationForm.valid) return fail(400, { allocationForm })

    try {
      await createServerApiClient(event).categories.replaceAllocationTargets({
        enabled: allocationForm.data.enabled,
        targets: allocationForm.data.targets.map(({ categoryId, value }) => ({
          categoryId,
          value: value.toFixed(1),
        })),
      })
    } catch (error) {
      if (apiErrorCode(error) === 'INVALID_ALLOCATION_TARGETS') {
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
