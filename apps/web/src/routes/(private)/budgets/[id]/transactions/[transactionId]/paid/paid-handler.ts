import { updateTransactionPaid } from '$lib/budget-planning/server'
import { json } from '@sveltejs/kit'
import { z } from 'zod'

const paidSchema = z.object({ isPaid: z.boolean() })

type PatchTransactionPaidInput = {
  budgetId: string
  transactionId: string
  userId: string
  request: Request
}

export async function patchTransactionPaid({
  budgetId,
  transactionId,
  userId,
  request,
}: PatchTransactionPaidInput) {
  const body: unknown = await request.json().catch(() => undefined)

  const parsed = paidSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = await updateTransactionPaid(
    budgetId,
    userId,
    transactionId,
    parsed.data.isPaid,
  )

  if (result.error === 'not_found') {
    return json({ error: 'Transaction not found' }, { status: 404 })
  }

  return json({ ok: true })
}
