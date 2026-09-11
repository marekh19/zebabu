import { positionTransaction } from '$lib/budget-planning/server'
import { json } from '@sveltejs/kit'
import { z } from 'zod'

const positionSchema = z.object({
  targetBudgetCategoryId: z.string().min(1),
  targetIndex: z.int().nonnegative(),
})

type PatchTransactionPositionInput = {
  budgetId: string
  transactionId: string
  userId: string
  request: Request
}

export async function patchTransactionPosition({
  budgetId,
  transactionId,
  userId,
  request,
}: PatchTransactionPositionInput) {
  const body: unknown = await request.json().catch(() => undefined)
  const parsed = positionSchema.safeParse(body)

  if (!parsed.success) {
    return json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = await positionTransaction({
    budgetId,
    userId,
    transactionId,
    targetBudgetCategoryId: parsed.data.targetBudgetCategoryId,
    targetIndex: parsed.data.targetIndex,
  })

  if (result.error === 'not_found') {
    return json({ error: 'Transaction not found' }, { status: 404 })
  }

  if (result.error === 'invalid_position') {
    return json({ error: 'Invalid target position' }, { status: 400 })
  }

  return json({ ok: true })
}
