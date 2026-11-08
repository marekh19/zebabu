import { resolve } from '$app/paths'
import { handleDuplicateBudgetAction } from '$lib/api/duplicate-budget-action'
import { apiErrorCode, createServerApiClient } from '$lib/api/server-client'
import {
  addBudgetCategorySchema,
  createAllocationTargetsSchema,
  createCreateTransactionSchema,
  createUpdateTransactionSchema,
  deleteTransactionSchema,
  getBudgetDisplayName,
} from '$lib/budget-planning'
import { error, fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  const { params, url } = event
  const client = createServerApiClient(event)
  let result: Awaited<ReturnType<typeof client.budgets.get>>
  try {
    result = await client.budgets.get({ budgetId: params.id })
  } catch (caught) {
    if (apiErrorCode(caught) === 'NOT_FOUND') error(404)
    throw caught
  }

  const defaultAllocationTargets = (await client.categories.list())
    .filter(
      ({ type, defaultAllocationTarget }) =>
        type === 'expense' && defaultAllocationTarget !== null,
    )
    .map(({ id, defaultAllocationTarget }) => ({
      categoryId: id,
      value: defaultAllocationTarget ?? '0.0',
    }))
  const defaultTargetsByCategoryId = new Map(
    defaultAllocationTargets.map(({ categoryId, value }) => [
      categoryId,
      Number(value),
    ]),
  )
  const expenseCategories = result.budget.budgetCategories.filter(
    ({ category }) => category.type === 'expense',
  )
  const allocationTargetsEnabled =
    expenseCategories.length > 0 &&
    expenseCategories.every(({ allocationTarget }) => allocationTarget !== null)

  const [
    addCategoryForm,
    createTransactionForm,
    updateTransactionForm,
    allocationForm,
  ] = await Promise.all([
    superValidate(zod4(addBudgetCategorySchema)),
    superValidate(zod4(createCreateTransactionSchema())),
    superValidate(zod4(createUpdateTransactionSchema())),
    superValidate(
      {
        enabled: allocationTargetsEnabled,
        targets: expenseCategories.map(
          ({ id, allocationTarget, category }) => ({
            categoryId: id,
            value: allocationTargetsEnabled
              ? Number(allocationTarget)
              : expenseCategories.length === 1
                ? 100
                : (defaultTargetsByCategoryId.get(category.id) ?? 0),
          }),
        ),
      },
      zod4(createAllocationTargetsSchema()),
    ),
  ])
  const requestedTransactionCategoryId = url.searchParams.get(
    'createTransactionCategory',
  )

  return {
    budget: result.budget,
    availableCategories: result.availableCategories,
    addCategoryForm,
    createTransactionForm,
    updateTransactionForm,
    allocationForm,
    currentDefaultTargets: expenseCategories.flatMap(({ id, category }) => {
      const value = defaultTargetsByCategoryId.get(category.id)
      return value === undefined ? [] : [{ categoryId: id, value }]
    }),
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

  delete: async (event) => {
    try {
      await createServerApiClient(event).budgets.delete({
        budgetId: event.params.id,
      })
    } catch (caught) {
      if (apiErrorCode(caught) === 'NOT_FOUND') return fail(404)
      throw caught
    }

    redirect(303, resolve('/budgets'))
  },

  addCategory: async (event) => {
    const { request, params } = event
    const form = await superValidate(request, zod4(addBudgetCategorySchema))

    if (!form.valid) return fail(400, { addCategoryForm: form })

    try {
      await createServerApiClient(event).budgets.addCategory({
        budgetId: params.id,
        categoryId: form.data.categoryId,
      })
    } catch (caught) {
      if (apiErrorCode(caught) === 'NOT_FOUND')
        return fail(404, {
          addCategoryForm: form,
          error: 'not_found' as const,
        })
      console.error('Adding category to budget failed:', caught)
      return fail(500, { addCategoryForm: form, error: 'unexpected' as const })
    }

    return { addCategoryForm: form }
  },

  saveAllocationTargets: async (event) => {
    const { request, params } = event
    const allocationForm = await superValidate(
      request,
      zod4(createAllocationTargetsSchema()),
    )
    if (!allocationForm.valid) return fail(400, { allocationForm })

    try {
      await createServerApiClient(event).budgets.replaceAllocationTargets({
        budgetId: params.id,
        enabled: allocationForm.data.enabled,
        targets: allocationForm.data.targets.map(({ categoryId, value }) => ({
          budgetCategoryId: categoryId,
          value: value.toFixed(1),
        })),
      })
    } catch (caught) {
      if (apiErrorCode(caught) === 'NOT_FOUND') return fail(404)
      if (apiErrorCode(caught) === 'INVALID_ALLOCATION_TARGETS') {
        return fail(400, {
          allocationForm,
          allocationError: 'invalid' as const,
        })
      }
      console.error('Budget allocation target update failed:', caught)
      return fail(500, {
        allocationForm,
        allocationError: 'unexpected' as const,
      })
    }

    return { allocationForm }
  },

  createTransaction: async (event) => {
    const { request, params } = event
    const form = await superValidate(
      request,
      zod4(createCreateTransactionSchema()),
    )

    if (!form.valid) return fail(400, { createTransactionForm: form })

    try {
      await createServerApiClient(event).budgets.createTransaction({
        budgetId: params.id,
        budgetCategoryId: form.data.budgetCategoryId,
        name: form.data.name,
        amount: form.data.amount.toFixed(2),
        isPaid: form.data.isPaid,
        note: form.data.note,
      })
    } catch (caught) {
      if (apiErrorCode(caught) === 'NOT_FOUND')
        return fail(404, {
          createTransactionForm: form,
          createTransactionError: 'not_found' as const,
        })
      console.error('Creating transaction failed:', caught)
      return fail(500, {
        createTransactionForm: form,
        createTransactionError: 'unexpected' as const,
      })
    }

    if (!request.headers.has('x-sveltekit-action'))
      redirect(303, resolve(`/budgets/${params.id}`))

    return { createTransactionForm: form }
  },

  updateTransaction: async (event) => {
    const { request, params } = event
    const form = await superValidate(
      request,
      zod4(createUpdateTransactionSchema()),
    )

    if (!form.valid) return fail(400, { updateTransactionForm: form })

    try {
      await createServerApiClient(event).budgets.updateTransaction({
        budgetId: params.id,
        transactionId: form.data.transactionId,
        name: form.data.name,
        amount: form.data.amount.toFixed(2),
        isPaid: form.data.isPaid,
        note: form.data.note,
      })
    } catch (caught) {
      if (apiErrorCode(caught) === 'NOT_FOUND')
        return fail(404, {
          updateTransactionForm: form,
          updateTransactionError: 'not_found' as const,
        })
      console.error('Updating transaction failed:', caught)
      return fail(500, {
        updateTransactionForm: form,
        updateTransactionError: 'unexpected' as const,
      })
    }

    if (!request.headers.has('x-sveltekit-action'))
      redirect(303, resolve(`/budgets/${params.id}`))

    return { updateTransactionForm: form }
  },

  deleteTransaction: async (event) => {
    const { request, params } = event
    const form = await superValidate(request, zod4(deleteTransactionSchema))

    if (!form.valid) return fail(400)

    try {
      await createServerApiClient(event).budgets.deleteTransaction({
        budgetId: params.id,
        transactionId: form.data.transactionId,
      })
    } catch (caught) {
      if (apiErrorCode(caught) === 'NOT_FOUND')
        return fail(404, { deleteTransactionError: 'not_found' as const })
      console.error('Deleting transaction failed:', caught)
      return fail(500, { deleteTransactionError: 'unexpected' as const })
    }

    if (!request.headers.has('x-sveltekit-action'))
      redirect(303, resolve(`/budgets/${params.id}`))

    return {}
  },
}
