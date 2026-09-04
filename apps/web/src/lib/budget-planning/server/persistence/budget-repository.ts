import {
  database as db,
  type DbTransaction,
} from '$lib/server/persistence/database'
import { budgetPlanningSchema } from '$lib/server/persistence/schema'
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import {
  isOwnedBudgetCategory,
  nextTransactionSortOrder,
} from '../budgets/transaction-rules'

const { budget, budgetCategory, transaction } = budgetPlanningSchema

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

export function findBudgetOwner(budgetId: string) {
  return db.query.budget.findFirst({
    where: eq(budget.id, budgetId),
    columns: { id: true, userId: true },
  })
}

export function insertBudget(
  tx: DbTransaction,
  values: typeof budget.$inferInsert,
) {
  return tx.insert(budget).values(values).returning()
}

export async function updateBudgetCategorySortOrders(
  tx: DbTransaction,
  budgetId: string,
  items: { id: string; sortOrder: number }[],
) {
  if (items.length === 0) return

  const sqlChunks: SQL[] = [sql`(case`]
  const ids: string[] = []

  for (const item of items) {
    sqlChunks.push(
      sql`when ${budgetCategory.id} = ${item.id} then ${item.sortOrder}`,
    )
    ids.push(item.id)
  }

  sqlChunks.push(sql`end)::integer`)

  return tx
    .update(budgetCategory)
    .set({ sortOrder: sql.join(sqlChunks, sql.raw(' ')) })
    .where(
      and(
        eq(budgetCategory.budgetId, budgetId),
        inArray(budgetCategory.id, ids),
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

export function findOwnedBudgetCategory(
  tx: DbTransaction,
  budgetCategoryId: string,
  budgetId: string,
  userId: string,
) {
  return tx.query.budgetCategory
    .findFirst({
      where: and(
        eq(budgetCategory.id, budgetCategoryId),
        eq(budgetCategory.budgetId, budgetId),
      ),
      with: { budget: true },
    })
    .then((found) => (isOwnedBudgetCategory(found, userId) ? found : undefined))
}

export async function findOwnedTransaction(
  tx: DbTransaction,
  transactionId: string,
  budgetId: string,
  userId: string,
) {
  const [found] = await tx
    .select({
      id: transaction.id,
      budgetCategoryId: transaction.budgetCategoryId,
      sortOrder: transaction.sortOrder,
    })
    .from(transaction)
    .innerJoin(
      budgetCategory,
      eq(transaction.budgetCategoryId, budgetCategory.id),
    )
    .innerJoin(budget, eq(budgetCategory.budgetId, budget.id))
    .where(
      and(
        eq(transaction.id, transactionId),
        eq(budget.id, budgetId),
        eq(budget.userId, userId),
      ),
    )
    .limit(1)

  return found
}

export function updateTransactionById(
  tx: DbTransaction,
  transactionId: string,
  values: Pick<
    typeof transaction.$inferInsert,
    'name' | 'amount' | 'isPaid' | 'note'
  >,
) {
  return tx
    .update(transaction)
    .set(values)
    .where(eq(transaction.id, transactionId))
    .returning()
}

export async function insertTransactionAtEnd(
  tx: DbTransaction,
  values: Omit<typeof transaction.$inferInsert, 'sortOrder'>,
) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${values.budgetCategoryId}))`,
  )

  const [lastTransaction] = await tx
    .select({ sortOrder: transaction.sortOrder })
    .from(transaction)
    .where(eq(transaction.budgetCategoryId, values.budgetCategoryId))
    .orderBy(desc(transaction.sortOrder))
    .limit(1)

  return tx
    .insert(transaction)
    .values({ ...values, sortOrder: nextTransactionSortOrder(lastTransaction) })
    .returning()
}
