import { resolve } from '$app/paths'
import { addBudgetCategorySchema } from '$lib/features/budgets/schemas/add-budget-category-schema'
import { getBudgetDisplayName } from '$lib/features/budgets/utils/month-names'
import { handleDuplicateBudgetAction } from '$lib/server/budgets/action-helpers'
import {
  addBudgetCategory,
  deleteBudget,
  getBudgetDetail,
} from '$lib/server/budgets/service'
import { findCategoriesNotInBudget } from '$lib/server/categories/repository'
import { error, fail, redirect } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

const ERROR_STATUS = {
  not_found: 404,
  access_denied: 403,
} as const satisfies Record<'not_found' | 'access_denied', number>

export const load: PageServerLoad = async ({ params, locals }) => {
  const userId = ensureDefined(locals.user).id
  const result = await getBudgetDetail(params.id, userId)

  if (result.error) {
    error(ERROR_STATUS[result.error])
  }

  const [availableCategories, addCategoryForm] = await Promise.all([
    findCategoriesNotInBudget(userId, params.id),
    superValidate(zod4(addBudgetCategorySchema)),
  ])

  return {
    budget: result.budget,
    availableCategories,
    addCategoryForm,
    breadcrumbSegments: {
      [params.id]: getBudgetDisplayName(result.budget),
    },
  }
}

export const actions: Actions = {
  duplicate: (event) =>
    handleDuplicateBudgetAction(event, (id) => resolve(`/budgets/${id}`)),

  delete: async ({ params, locals }) => {
    const userId = ensureDefined(locals.user).id
    const result = await deleteBudget(params.id, userId)

    if (result.error) return fail(ERROR_STATUS[result.error])

    redirect(303, resolve('/budgets'))
  },

  addCategory: async ({ request, params, locals }) => {
    const userId = ensureDefined(locals.user).id
    const form = await superValidate(request, zod4(addBudgetCategorySchema))

    if (!form.valid) return fail(400, { addCategoryForm: form })

    const result = await addBudgetCategory(
      params.id,
      userId,
      form.data.categoryId,
    ).catch((error: unknown) => {
      console.error('Adding category to budget failed:', error)
      return null
    })

    if (!result)
      return fail(500, { addCategoryForm: form, error: 'unexpected' as const })

    if (result.error === 'not_found' || result.error === 'access_denied')
      return fail(ERROR_STATUS[result.error], {
        addCategoryForm: form,
        error: 'unexpected' as const,
      })
    if (result.error === 'category_not_found')
      return fail(404, {
        addCategoryForm: form,
        error: 'not_found' as const,
      })

    return { addCategoryForm: form }
  },
}
