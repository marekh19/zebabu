import { db } from '$lib/server/db'
import {
  budget,
  budgetCategory,
  category,
  transaction,
} from '$lib/server/db/schema'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'

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

export function findBudgetById(budgetId: string) {
  return db.query.budget.findFirst({
    where: eq(budget.id, budgetId),
    with: {
      budgetCategories: {
        orderBy: asc(budgetCategory.sortOrder),
        with: {
          category: true,
          transactions: {
            orderBy: asc(transaction.sortOrder),
          },
        },
      },
    },
  })
}

export function insertBudget(
  tx: DbTransaction,
  values: typeof budget.$inferInsert,
) {
  return tx.insert(budget).values(values).returning()
}

export function insertCategoryDefinitions(
  tx: DbTransaction,
  values: (typeof category.$inferInsert)[],
) {
  return tx.insert(category).values(values).onConflictDoNothing()
}

export function findCategoryDefinitionsByName(
  tx: DbTransaction,
  userId: string,
  names: string[],
) {
  return tx.query.category.findMany({
    where: and(eq(category.userId, userId), inArray(category.name, names)),
  })
}

export function insertBudgetCategories(
  tx: DbTransaction,
  values: (typeof budgetCategory.$inferInsert)[],
) {
  return tx.insert(budgetCategory).values(values)
}

export function findCategoryDefinitionsByUser(userId: string) {
  return db.query.category.findMany({
    where: eq(category.userId, userId),
    orderBy: asc(category.name),
  })
}
