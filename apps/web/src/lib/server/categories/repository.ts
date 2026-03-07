import { db } from '$lib/server/db'
import { category } from '$lib/server/db/schema'
import { asc, eq } from 'drizzle-orm'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export function insertCategories(values: (typeof category.$inferInsert)[]) {
  return db.insert(category).values(values)
}

export function findCategoriesByUser(tx: DbTransaction, userId: string) {
  return tx.query.category.findMany({
    where: eq(category.userId, userId),
    orderBy: asc(category.name),
  })
}
