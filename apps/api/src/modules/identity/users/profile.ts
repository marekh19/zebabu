import { database } from '#api-database'
import { eq } from 'drizzle-orm'
import { user } from '../schema'

export async function findProfile(userId: string) {
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
  return found
}

export async function updateProfile(userId: string, primaryCurrency: string) {
  await database
    .update(user)
    .set({ primaryCurrency })
    .where(eq(user.id, userId))
  return findProfile(userId)
}
