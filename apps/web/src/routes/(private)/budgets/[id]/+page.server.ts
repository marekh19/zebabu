import { resolve } from '$app/paths'
import { getBudgetDisplayName } from '$lib/features/budgets/utils/month-names'
import { handleDuplicateBudgetAction } from '$lib/server/budgets/action-helpers'
import { deleteBudget, getBudgetDetail } from '$lib/server/budgets/service'
import { error, fail, redirect } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
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
  duplicate: (event) =>
    handleDuplicateBudgetAction(event, (id) => resolve(`/budgets/${id}`)),

  delete: async ({ params, locals }) => {
    const userId = ensureDefined(locals.user).id
    const result = await deleteBudget(params.id, userId)

    if (result.error === 'not_found') return fail(404)
    if (result.error === 'access_denied') return fail(403)

    redirect(303, resolve('/budgets'))
  },
}
