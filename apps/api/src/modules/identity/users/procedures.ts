import { implement, ORPCError } from '@orpc/server'
import { profileContract, profileSchema } from '@zebabu/api-contract'
import { requireUser, type RequestContext } from '../../../http/principal'
import { findProfile, updateProfile } from './profile'

const procedures = implement(profileContract).$context<RequestContext>()

function requireProfile(found: Awaited<ReturnType<typeof findProfile>>) {
  if (!found) throw new ORPCError('UNAUTHORIZED')
  return profileSchema.parse(found)
}

export const profileRouter = procedures.router({
  get: procedures.get.handler(async ({ context }) => {
    const principal = await requireUser(context)
    return requireProfile(await findProfile(principal.id))
  }),
  update: procedures.update.handler(async ({ context, input }) => {
    const principal = await requireUser(context)
    return requireProfile(
      await updateProfile(principal.id, input.primaryCurrency),
    )
  }),
})
