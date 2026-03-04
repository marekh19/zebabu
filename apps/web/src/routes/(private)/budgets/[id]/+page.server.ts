import { getBudgetDisplayName } from '$lib/features/budgets/utils/month-names'
import { getBudgetDetail } from '$lib/server/budgets/service'
import { error } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import type { PageServerLoad } from './$types'

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
