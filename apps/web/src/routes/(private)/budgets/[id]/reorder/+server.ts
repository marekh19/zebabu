import { reorderBudgetCategories } from '$lib/budget-planning/server'
import { OperationErrorCode } from '$lib/operation-result'
import { getAuthenticatedUserId } from '$lib/server/authenticated-user'
import { json } from '@sveltejs/kit'
import { z } from 'zod'
import type { RequestHandler } from './$types'

const reorderSchema = z.array(
  z.object({
    id: z.string(),
    sortOrder: z.int().nonnegative(),
  }),
)

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
  const userId = getAuthenticatedUserId(locals)

  const body: unknown = await request.json()
  const parsed = reorderSchema.safeParse(body)

  if (!parsed.success) {
    return json({ code: OperationErrorCode.InvalidInput }, { status: 400 })
  }

  const result = await reorderBudgetCategories(params.id, userId, parsed.data)

  if (result.error === OperationErrorCode.NotFound) {
    return json({ code: OperationErrorCode.NotFound }, { status: 404 })
  }

  if (result.error === OperationErrorCode.InvalidPosition) {
    return json({ code: OperationErrorCode.InvalidPosition }, { status: 400 })
  }

  return json({ ok: true })
}
