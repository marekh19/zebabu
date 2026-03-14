import type { CategoryColor } from '$lib/features/categories/colors'
import { db } from '$lib/server/db'
import { category } from '$lib/server/db/schema'
import { and, asc, eq, ne } from 'drizzle-orm'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export function insertCategories(values: (typeof category.$inferInsert)[]) {
  return db.insert(category).values(values)
}

export function insertCategoryTx(
  tx: DbTransaction,
  value: typeof category.$inferInsert,
) {
  return tx.insert(category).values(value).returning()
}

export function findCategoryByName(
  tx: DbTransaction,
  userId: string,
  name: string,
) {
  return tx.query.category.findFirst({
    where: and(eq(category.userId, userId), eq(category.name, name)),
  })
}

export function findCategoriesByUserTx(tx: DbTransaction, userId: string) {
  return tx.query.category.findMany({
    where: eq(category.userId, userId),
    orderBy: asc(category.name),
  })
}

export function findCategoriesByUser(userId: string) {
  return db.query.category.findMany({
    where: eq(category.userId, userId),
    orderBy: asc(category.name),
  })
}

export function findCategoryByNameExcluding(
  tx: DbTransaction,
  userId: string,
  name: string,
  excludeId: string,
) {
  return tx.query.category.findFirst({
    where: and(
      eq(category.userId, userId),
      eq(category.name, name),
      ne(category.id, excludeId),
    ),
  })
}

export function updateCategoryTx(
  tx: DbTransaction,
  categoryId: string,
  data: { name: string; color: CategoryColor },
) {
  return tx
    .update(category)
    .set({ name: data.name, color: data.color })
    .where(eq(category.id, categoryId))
    .returning()
}
