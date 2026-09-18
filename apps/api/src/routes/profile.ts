import { implement, ORPCError } from '@orpc/server'
import { profileContract, profileSchema } from '@zebabu/api-contract'
import { eq } from 'drizzle-orm'
import { database } from '../lib/server/persistence/database'
import { user } from '../lib/server/persistence/schema'
import { requireUser, type RequestContext } from '../principal'

const procedures = implement(profileContract).$context<RequestContext>()

async function findProfile(userId: string) {
  const [found] = await database
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      primaryCurrency: user.primaryCurrency,
    })
    .from(user)
    .where(eq(user.id, userId))
  if (!found) throw new ORPCError('UNAUTHORIZED')
  return profileSchema.parse(found)
}

export const profileRouter = procedures.router({
  get: procedures.get.handler(async ({ context }) => {
    const principal = await requireUser(context)
    return findProfile(principal.id)
  }),
  update: procedures.update.handler(async ({ context, input }) => {
    const principal = await requireUser(context)
    await database
      .update(user)
      .set({ primaryCurrency: input.primaryCurrency })
      .where(eq(user.id, principal.id))
    return findProfile(principal.id)
  }),
})
