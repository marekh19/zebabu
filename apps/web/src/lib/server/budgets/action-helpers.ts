import { createDuplicateBudgetSchema } from '$lib/features/budgets/schemas/duplicate-budget-schema'
import {
  duplicateBudget,
  DuplicateMonthlyBudgetError,
  DuplicateScenarioBudgetError,
} from '$lib/server/budgets/service'
import { fail, redirect } from '@sveltejs/kit'
import { ensureDefined } from 'narrowland'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'

type ActionEvent = {
  request: Request
  locals: App.Locals
}

export async function handleDuplicateBudgetAction(
  { request, locals }: ActionEvent,
  buildRedirectPath: (budgetId: string) => string,
) {
  const form = await superValidate(request, zod4(createDuplicateBudgetSchema()))

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
    redirect(303, buildRedirectPath(ensureDefined(result.budget).id))
  } catch (err) {
    if (err instanceof DuplicateMonthlyBudgetError) {
      return fail(409, { form, error: 'duplicate_monthly' as const })
    }
    if (err instanceof DuplicateScenarioBudgetError) {
      return fail(409, { form, error: 'duplicate_scenario' as const })
    }
    throw err
  }
}
