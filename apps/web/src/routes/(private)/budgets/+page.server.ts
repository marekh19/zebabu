import { createCreateBudgetSchema } from '$lib/features/budgets/schemas/create-budget-schema'
import { createDuplicateBudgetSchema } from '$lib/features/budgets/schemas/duplicate-budget-schema'
import {
  createMonthlyBudget,
  createScenarioBudget,
  deleteBudget,
  duplicateBudget,
  DuplicateMonthlyBudgetError,
  DuplicateScenarioBudgetError,
  listBudgets,
} from '$lib/server/budgets/service'
import { fail, redirect } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const budgets = await listBudgets(ensureDefined(locals.user).id)
  const form = await superValidate(zod4(createCreateBudgetSchema()))

  return { budgets, form }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(createCreateBudgetSchema()))

    if (!form.valid) {
      return fail(400, { form })
    }

    const userId = ensureDefined(locals.user).id
    const { type, month, year, name } = form.data

    let budgetId: string
    try {
      const budget =
        type === 'monthly'
          ? await createMonthlyBudget(userId, {
              month: ensureDefined(month),
              year: ensureDefined(year),
            })
          : await createScenarioBudget(userId, { name: ensureDefined(name) })
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

    redirect(303, `/budgets/${budgetId}`)
  },

  duplicate: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(createDuplicateBudgetSchema()),
    )

    if (!form.valid) return fail(400, { form })

    const userId = ensureDefined(locals.user).id

    try {
      const result = await duplicateBudget(
        form.data.sourceBudgetId,
        userId,
        form.data,
      )
      if (result.error === 'not_found') return fail(404)
      if (result.error === 'access_denied') return fail(403)
      redirect(303, `/budgets/${ensureDefined(result.budget).id}`)
    } catch (error) {
      if (error instanceof DuplicateMonthlyBudgetError) {
        return fail(409, { form, error: 'duplicate_monthly' as const })
      }
      if (error instanceof DuplicateScenarioBudgetError) {
        return fail(409, { form, error: 'duplicate_scenario' as const })
      }
      throw error
    }
  },

  delete: async ({ request, locals }) => {
    const data = await request.formData()
    const budgetId = data.get('budgetId')

    if (typeof budgetId !== 'string') {
      return fail(400)
    }

    const userId = ensureDefined(locals.user).id
    const result = await deleteBudget(budgetId, userId)

    if (result.error === 'not_found') return fail(404)
    if (result.error === 'access_denied') return fail(403)

    return { deleted: true }
  },
}
