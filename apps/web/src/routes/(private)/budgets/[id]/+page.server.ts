import { resolve } from '$app/paths'
import { createDuplicateBudgetSchema } from '$lib/features/budgets/schemas/duplicate-budget-schema'
import { getBudgetDisplayName } from '$lib/features/budgets/utils/month-names'
import {
  deleteBudget,
  duplicateBudget,
  DuplicateMonthlyBudgetError,
  DuplicateScenarioBudgetError,
  getBudgetDetail,
} from '$lib/server/budgets/service'
import { error, fail, redirect } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const userId = ensureDefined(locals.user).id
  const result = await getBudgetDetail(params.id, userId)

  const errorStatusMap = {
    not_found: 404,
    access_denied: 403,
  } as const

  if (result.error) {
    error(errorStatusMap[result.error])
  }

  return {
    budget: result.budget,
    breadcrumbSegments: {
      [params.id]: getBudgetDisplayName(result.budget),
    },
  }
}

export const actions: Actions = {
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
      redirect(303, resolve(`/budgets/${ensureDefined(result.budget).id}`))
    } catch (err) {
      if (err instanceof DuplicateMonthlyBudgetError) {
        return fail(409, { form, error: 'duplicate_monthly' as const })
      }
      if (err instanceof DuplicateScenarioBudgetError) {
        return fail(409, { form, error: 'duplicate_scenario' as const })
      }
      throw err
    }
  },

  delete: async ({ params, locals }) => {
    const userId = ensureDefined(locals.user).id
    const result = await deleteBudget(params.id, userId)

    if (result.error === 'not_found') return fail(404)
    if (result.error === 'access_denied') return fail(403)

    redirect(303, resolve('/budgets'))
  },
}
