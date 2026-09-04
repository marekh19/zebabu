import { getAuthenticatedUserId } from '$lib/server/authenticated-user'
import type { RequestHandler } from './$types'
import { patchTransactionPaid } from './paid-handler'

export const PATCH: RequestHandler = ({ params, locals, request }) =>
  patchTransactionPaid({
    budgetId: params.id,
    transactionId: params.transactionId,
    userId: getAuthenticatedUserId(locals),
    request,
  })
