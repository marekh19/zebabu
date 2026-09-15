import { resolve } from '$app/paths'
import { createCreateBudgetSchema } from '$lib/budget-planning'
import {
  createMonthlyBudget,
  createScenarioBudget,
  deleteBudget,
  DuplicateMonthlyBudgetError,
  DuplicateScenarioBudgetError,
  getCompleteDefaultAllocationTargets,
  handleDuplicateBudgetAction,
  listBudgets,
} from '$lib/budget-planning/server'
import { getAuthenticatedUserId } from '$lib/server/authenticated-user'
import { fail, redirect } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const userId = getAuthenticatedUserId(locals)
  const [budgets, defaultAllocationTargets] = await Promise.all([
    listBudgets(userId),
    getCompleteDefaultAllocationTargets(userId),
  ])
  const form = await superValidate(zod4(createCreateBudgetSchema()))

  return {
    budgets,
    form,
    hasDefaultAllocationTargets: defaultAllocationTargets !== null,
  }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(createCreateBudgetSchema()))

    if (!form.valid) {
      return fail(400, { form })
    }

    const userId = getAuthenticatedUserId(locals)
    const { type, month, year, name, useDefaultAllocationTargets } = form.data

    let budgetId: string
    try {
      const budget =
        type === 'monthly'
          ? await createMonthlyBudget(userId, {
              month: ensureDefined(month),
              year: ensureDefined(year),
              useDefaultAllocationTargets,
            })
          : await createScenarioBudget(userId, {
              name: ensureDefined(name),
              useDefaultAllocationTargets,
            })
      budgetId = budget.id
    } catch (error) {
      if (error instanceof DuplicateMonthlyBudgetError) {
        return fail(409, { form, error: 'duplicate_monthly' as const })
      }
      if (error instanceof DuplicateScenarioBudgetError) {
        return fail(409, { form, error: 'duplicate_scenario' as const })
      }
      console.error('Budget creation failed:', error)
      return fail(500, { form, error: 'unexpected' as const })
    }

    redirect(303, resolve(`/budgets/${budgetId}`))
  },

  duplicate: (event) =>
    handleDuplicateBudgetAction(event, (id) => resolve(`/budgets/${id}`)),

  delete: async ({ request, locals }) => {
    const data = await request.formData()
    const budgetId = data.get('budgetId')

    if (typeof budgetId !== 'string') {
      return fail(400)
    }

    const userId = getAuthenticatedUserId(locals)
    const result = await deleteBudget(budgetId, userId)

    if (result.error === 'NOT_FOUND') return fail(404)

    return { deleted: true }
  },
}
