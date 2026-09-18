import { resolve } from '$app/paths'
import { handleDuplicateBudgetAction } from '$lib/api/duplicate-budget-action'
import { apiErrorCode, createServerApiClient } from '$lib/api/server-client'
import { createCreateBudgetSchema } from '$lib/budget-planning'
import { fail, redirect } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  const client = createServerApiClient(event)
  const [budgets, categories] = await Promise.all([
    client.budgets.list(),
    client.categories.list(),
  ])
  const form = await superValidate(zod4(createCreateBudgetSchema()))

  return {
    budgets,
    form,
    hasDefaultAllocationTargets:
      categories.some(({ type }) => type === 'expense') &&
      categories
        .filter(({ type }) => type === 'expense')
        .every(
          ({ defaultAllocationTarget }) => defaultAllocationTarget !== null,
        ),
  }
}

export const actions: Actions = {
  create: async (event) => {
    const { request } = event
    const form = await superValidate(request, zod4(createCreateBudgetSchema()))

    if (!form.valid) {
      return fail(400, { form })
    }

    const { type, month, year, name, useDefaultAllocationTargets } = form.data

    let budgetId: string
    try {
      const budget = await createServerApiClient(event).budgets.create(
        type === 'monthly'
          ? {
              type: 'monthly',
              month: ensureDefined(month),
              year: ensureDefined(year),
              useDefaultAllocationTargets,
            }
          : {
              type: 'scenario',
              name: ensureDefined(name),
              useDefaultAllocationTargets,
            },
      )
      budgetId = budget.id
    } catch (error) {
      if (apiErrorCode(error) === 'CONFLICT' && type === 'monthly') {
        return fail(409, { form, error: 'duplicate_monthly' as const })
      }
      if (apiErrorCode(error) === 'CONFLICT' && type === 'scenario') {
        return fail(409, { form, error: 'duplicate_scenario' as const })
      }
      console.error('Budget creation failed:', error)
      return fail(500, { form, error: 'unexpected' as const })
    }

    redirect(303, resolve(`/budgets/${budgetId}`))
  },

  duplicate: (event) =>
    handleDuplicateBudgetAction(event, (id) => resolve(`/budgets/${id}`)),

  delete: async (event) => {
    const { request } = event
    const data = await request.formData()
    const budgetId = data.get('budgetId')

    if (typeof budgetId !== 'string') {
      return fail(400)
    }

    try {
      await createServerApiClient(event).budgets.delete({ budgetId })
    } catch (error) {
      if (apiErrorCode(error) === 'NOT_FOUND') return fail(404)
      throw error
    }

    return { deleted: true }
  },
}
