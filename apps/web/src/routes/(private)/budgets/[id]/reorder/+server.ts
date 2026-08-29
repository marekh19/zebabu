import { reorderBudgetCategories } from '$lib/budget-planning/server'
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
    return json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = await reorderBudgetCategories(params.id, userId, parsed.data)

  if (result.error === 'not_found') {
    return json({ error: 'Budget not found' }, { status: 404 })
  }

  if (result.error === 'access_denied') {
    return json({ error: 'Access denied' }, { status: 403 })
  }

  return json({ ok: true })
}
