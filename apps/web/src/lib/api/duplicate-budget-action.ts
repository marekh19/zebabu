import { createDuplicateBudgetSchema } from '$lib/budget-planning/budgets/schemas/duplicate-budget-schema'
import { fail, redirect, type RequestEvent } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import { apiErrorCode, createServerApiClient } from './server-client'

export async function handleDuplicateBudgetAction(
  event: RequestEvent,
  buildRedirectPath: (budgetId: string) => string,
) {
  const form = await superValidate(
    event.request,
    zod4(createDuplicateBudgetSchema()),
  )
  if (!form.valid) return fail(400, { form })

  const input =
    form.data.type === 'monthly'
      ? {
          budgetId: form.data.sourceBudgetId,
          type: 'monthly' as const,
          month: form.data.month ?? 0,
          year: form.data.year ?? 0,
        }
      : {
          budgetId: form.data.sourceBudgetId,
          type: 'scenario' as const,
          name: form.data.name ?? '',
        }

  try {
    const budget = await createServerApiClient(event).budgets.duplicate(input)
    redirect(303, buildRedirectPath(budget.id))
  } catch (error) {
    if (apiErrorCode(error) === 'NOT_FOUND') return fail(404)
    if (apiErrorCode(error) === 'CONFLICT') {
      return fail(409, {
        form,
        error:
          form.data.type === 'monthly'
            ? ('duplicate_monthly' as const)
            : ('duplicate_scenario' as const),
      })
    }
    throw error
  }
}
