import { implement, ORPCError } from '@orpc/server'
import { keysContract } from '@zebabu/api-contract'
import {
  requireSessionUser,
  type RequestContext,
} from '../../../http/principal'
import { issueApiKey, listApiKeys, revokeApiKey } from './service'

const procedures = implement(keysContract).$context<RequestContext>()

export const keysRouter = procedures.router({
  list: procedures.list.handler(async ({ context }) =>
    listApiKeys((await requireSessionUser(context)).id),
  ),
  create: procedures.create.handler(async ({ context, input }) => {
    const principal = await requireSessionUser(context)
    const created = await issueApiKey(context.auth, principal.id, input)
    if (!created) throw new ORPCError('INTERNAL_ERROR')
    return created
  }),
  revoke: procedures.revoke.handler(async ({ context, input }) => {
    const principal = await requireSessionUser(context)
    if (!(await revokeApiKey(principal.id, input.keyId))) {
      throw new ORPCError('NOT_FOUND')
    }
    return { success: true }
  }),
})
