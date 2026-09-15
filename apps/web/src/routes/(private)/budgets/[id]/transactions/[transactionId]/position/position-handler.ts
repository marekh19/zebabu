import { positionTransaction } from '$lib/budget-planning/server/budgets/service'
import { OperationErrorCode } from '$lib/operation-result'
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
    return json({ code: OperationErrorCode.InvalidInput }, { status: 400 })
  }

  const result = await positionTransaction({
    budgetId,
    userId,
    transactionId,
    targetBudgetCategoryId: parsed.data.targetBudgetCategoryId,
    targetIndex: parsed.data.targetIndex,
  })

  if (result.error === OperationErrorCode.NotFound) {
    return json({ code: OperationErrorCode.NotFound }, { status: 404 })
  }

  if (result.error === OperationErrorCode.InvalidPosition) {
    return json({ code: OperationErrorCode.InvalidPosition }, { status: 400 })
  }

  return json({ ok: true })
}
