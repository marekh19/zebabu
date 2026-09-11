import { getAuthenticatedUserId } from '$lib/server/authenticated-user'
import type { RequestHandler } from './$types'
import { patchTransactionPosition } from './position-handler'

export const PATCH: RequestHandler = ({ params, locals, request }) =>
  patchTransactionPosition({
    budgetId: params.id,
    transactionId: params.transactionId,
    userId: getAuthenticatedUserId(locals),
    request,
  })
