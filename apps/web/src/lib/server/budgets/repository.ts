import { db } from '$lib/server/db'
import { budget, budgetCategory, transaction } from '$lib/server/db/schema'
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

export function findScenarioBudget(userId: string, name: string) {
  return db.query.budget.findFirst({
    where: and(eq(budget.userId, userId), eq(budget.name, name)),
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

export function updateBudgetCategorySortOrders(
  tx: DbTransaction,
  budgetId: string,
  items: { id: string; sortOrder: number }[],
) {
  return Promise.all(
    items.map((item) =>
      tx
        .update(budgetCategory)
        .set({ sortOrder: item.sortOrder })
        .where(
          and(
            eq(budgetCategory.id, item.id),
            eq(budgetCategory.budgetId, budgetId),
          ),
        ),
    ),
  )
}

export function deleteBudgetById(budgetId: string) {
  return db.delete(budget).where(eq(budget.id, budgetId))
}

export function insertBudgetCategories(
  tx: DbTransaction,
  values: (typeof budgetCategory.$inferInsert)[],
) {
  return tx.insert(budgetCategory).values(values).returning()
}

export function insertTransactions(
  tx: DbTransaction,
  values: (typeof transaction.$inferInsert)[],
) {
  return tx.insert(transaction).values(values)
}
