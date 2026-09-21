import { database as db, type DbTransaction } from '#api-database'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { budgetPlanningSchema } from '../../../infrastructure/database/schema'

const { budget, budgetCategory, category, transaction } = budgetPlanningSchema

export function findMonthlyBudget(
  userId: string,
  month: number,
  year: number,
  tx?: DbTransaction,
) {
  return (tx ?? db).query.budget.findFirst({
    where: and(
      eq(budget.userId, userId),
      eq(budget.month, month),
      eq(budget.year, year),
    ),
  })
}

export function findScenarioBudget(
  userId: string,
  name: string,
  tx?: DbTransaction,
) {
  return (tx ?? db).query.budget.findFirst({
    where: and(eq(budget.userId, userId), eq(budget.name, name)),
  })
}

export function listBudgetsByUser(userId: string) {
  return db.query.budget.findMany({
    where: eq(budget.userId, userId),
    orderBy: [desc(budget.year), desc(budget.month), asc(budget.name)],
  })
}

export function findBudgetById(
  budgetId: string,
  userId: string,
  tx?: DbTransaction,
) {
  const executor = tx ?? db
  return executor.query.budget.findFirst({
    where: and(eq(budget.id, budgetId), eq(budget.userId, userId)),
    with: {
      budgetCategories: {
        where: inArray(
          budgetCategory.categoryId,
          executor
            .select({ id: category.id })
            .from(category)
            .where(eq(category.userId, userId)),
        ),
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

export function findBudgetWithCategoriesTx(
  tx: DbTransaction,
  budgetId: string,
  userId: string,
) {
  return tx.query.budget.findFirst({
    where: and(eq(budget.id, budgetId), eq(budget.userId, userId)),
    with: {
      budgetCategories: {
        where: inArray(
          budgetCategory.categoryId,
          tx
            .select({ id: category.id })
            .from(category)
            .where(eq(category.userId, userId)),
        ),
        with: { category: true },
      },
    },
  })
}

export function findOwnedBudget(
  budgetId: string,
  userId: string,
  tx?: DbTransaction,
) {
  return (tx ?? db).query.budget.findFirst({
    where: and(eq(budget.id, budgetId), eq(budget.userId, userId)),
    columns: { id: true, userId: true },
  })
}

export function insertBudget(
  tx: DbTransaction,
  values: typeof budget.$inferInsert,
) {
  return tx.insert(budget).values(values).returning()
}

export function deleteBudgetById(budgetId: string, userId: string) {
  return db
    .delete(budget)
    .where(and(eq(budget.id, budgetId), eq(budget.userId, userId)))
    .returning({ id: budget.id })
}

export function lockBudget(
  tx: DbTransaction,
  budgetId: string,
  userId: string,
) {
  return tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${'budget:' + userId + ':' + budgetId}))`,
  )
}

export function lockUserBudgetSet(tx: DbTransaction, userId: string) {
  return tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${'budget-set:' + userId}))`,
  )
}
