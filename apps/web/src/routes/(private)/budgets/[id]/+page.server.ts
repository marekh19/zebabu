import { resolve } from '$app/paths'
import {
  addBudgetCategorySchema,
  createCreateTransactionSchema,
  getBudgetDisplayName,
} from '$lib/budget-planning'
import {
  addBudgetCategory,
  createTransaction,
  deleteBudget,
  getBudgetDetail,
  handleDuplicateBudgetAction,
} from '$lib/budget-planning/server'
import { error, fail, redirect } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

const ERROR_STATUS = {
  not_found: 404,
  access_denied: 403,
} as const satisfies Record<'not_found' | 'access_denied', number>

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const userId = ensureDefined(locals.user).id
  const result = await getBudgetDetail(params.id, userId)

  if (result.error) {
    error(ERROR_STATUS[result.error])
  }

  const [addCategoryForm, createTransactionForm] = await Promise.all([
    superValidate(zod4(addBudgetCategorySchema)),
    superValidate(zod4(createCreateTransactionSchema())),
  ])
  const requestedTransactionCategoryId = url.searchParams.get(
    'createTransactionCategory',
  )

  return {
    budget: result.budget,
    availableCategories: result.availableCategories,
    addCategoryForm,
    createTransactionForm,
    createTransactionCategoryId: result.budget.budgetCategories.find(
      ({ id }) => id === requestedTransactionCategoryId,
    )?.id,
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

  createTransaction: async ({ request, params, locals }) => {
    const userId = ensureDefined(locals.user).id
    const form = await superValidate(
      request,
      zod4(createCreateTransactionSchema()),
    )

    if (!form.valid) return fail(400, { createTransactionForm: form })

    const result = await createTransaction(
      params.id,
      userId,
      form.data.budgetCategoryId,
      form.data,
    ).catch((error: unknown) => {
      console.error('Creating transaction failed:', error)
      return null
    })

    if (!result)
      return fail(500, {
        createTransactionForm: form,
        createTransactionError: 'unexpected' as const,
      })

    if (result.error === 'not_found')
      return fail(404, {
        createTransactionForm: form,
        createTransactionError: 'not_found' as const,
      })

    if (!request.headers.has('x-sveltekit-action'))
      redirect(303, resolve(`/budgets/${params.id}`))

    return { createTransactionForm: form }
  },
}
