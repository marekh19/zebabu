import { createCreateBudgetSchema } from '$lib/features/budgets/schemas/create-budget-schema'
import {
  createMonthlyBudget,
  createScenarioBudget,
  DuplicateMonthlyBudgetError,
  listBudgets,
} from '$lib/server/budgets/service'
import { fail } from '@sveltejs/kit'
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

    try {
      if (type === 'monthly') {
        await createMonthlyBudget(userId, {
          month: ensureDefined(month),
          year: ensureDefined(year),
        })
      } else {
        await createScenarioBudget(userId, { name: ensureDefined(name) })
      }
    } catch (error) {
      if (error instanceof DuplicateMonthlyBudgetError) {
        return fail(409, { form, error: 'duplicate' as const })
      }
      console.error('Budget creation failed:', error)
      return fail(500, { form, error: 'unexpected' as const })
    }

    return { form }
  },
}
