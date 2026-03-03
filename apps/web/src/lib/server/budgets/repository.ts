import { db } from '$lib/server/db'
import { budget, category } from '$lib/server/db/schema'
import { and, asc, desc, eq } from 'drizzle-orm'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export function findMonthlyBudget(userId: string, month: number, year: number) {
  return db.query.budget.findFirst({
    where: and(
      eq(budget.userId, userId),
      eq(budget.month, month),
      eq(budget.year, year),
    ),
  })
}

export function listBudgetsByUser(userId: string) {
  return db.query.budget.findMany({
    where: eq(budget.userId, userId),
    orderBy: [desc(budget.year), desc(budget.month), asc(budget.name)],
  })
}

export function insertBudget(
  tx: DbTransaction,
  values: typeof budget.$inferInsert,
) {
  return tx.insert(budget).values(values).returning()
}

export function insertCategories(
  tx: DbTransaction,
  values: (typeof category.$inferInsert)[],
) {
  return tx.insert(category).values(values)
}
