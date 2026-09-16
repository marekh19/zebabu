import {
  database as db,
  type DbTransaction,
} from '$lib/server/persistence/database'
import { budgetPlanningSchema } from '$lib/server/persistence/schema'
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { nextTransactionSortOrder } from '../budgets/transaction-rules'

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

export async function updateBudgetCategorySortOrders(
  tx: DbTransaction,
  budgetId: string,
  userId: string,
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
        inArray(
          budgetCategory.budgetId,
          tx
            .select({ id: budget.id })
            .from(budget)
            .where(eq(budget.userId, userId)),
        ),
        inArray(budgetCategory.id, ids),
      ),
    )
}

export function deleteBudgetById(budgetId: string, userId: string) {
  return db
    .delete(budget)
    .where(and(eq(budget.id, budgetId), eq(budget.userId, userId)))
    .returning({ id: budget.id })
}

export function insertBudgetCategories(
  tx: DbTransaction,
  values: (typeof budgetCategory.$inferInsert)[],
) {
  return tx.insert(budgetCategory).values(values).returning()
}

export function updateBudgetCategoryAllocationTargetsTx(
  tx: DbTransaction,
  budgetId: string,
  userId: string,
  targets: readonly {
    budgetCategoryId: string
    allocationTarget: string | null
  }[],
) {
  if (targets.length === 0) return

  const ids = targets.map(({ budgetCategoryId }) => budgetCategoryId)
  const cases = targets.map(
    ({ budgetCategoryId, allocationTarget }) =>
      sql`when ${budgetCategory.id} = ${budgetCategoryId} then ${allocationTarget}`,
  )

  return tx
    .update(budgetCategory)
    .set({
      allocationTarget: sql`(case ${sql.join(cases, sql.raw(' '))} end)::numeric(4, 1)`,
    })
    .where(
      and(
        eq(budgetCategory.budgetId, budgetId),
        inArray(
          budgetCategory.budgetId,
          tx
            .select({ id: budget.id })
            .from(budget)
            .where(eq(budget.userId, userId)),
        ),
        inArray(budgetCategory.id, ids),
      ),
    )
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
  return tx
    .select({
      id: budgetCategory.id,
      budgetId: budgetCategory.budgetId,
      categoryId: budgetCategory.categoryId,
    })
    .from(budgetCategory)
    .innerJoin(budget, eq(budgetCategory.budgetId, budget.id))
    .where(
      and(
        eq(budgetCategory.id, budgetCategoryId),
        eq(budget.id, budgetId),
        eq(budget.userId, userId),
      ),
    )
    .limit(1)
    .then(([found]) => found)
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

function ownedBudgetCategoryIds(
  tx: DbTransaction,
  budgetId: string,
  userId: string,
) {
  return tx
    .select({ id: budgetCategory.id })
    .from(budgetCategory)
    .innerJoin(budget, eq(budgetCategory.budgetId, budget.id))
    .where(and(eq(budget.id, budgetId), eq(budget.userId, userId)))
}

export function updateTransactionById(
  tx: DbTransaction,
  transactionId: string,
  budgetId: string,
  userId: string,
  values: Pick<
    typeof transaction.$inferInsert,
    'name' | 'amount' | 'isPaid' | 'note'
  >,
) {
  return tx
    .update(transaction)
    .set(values)
    .where(
      and(
        eq(transaction.id, transactionId),
        inArray(
          transaction.budgetCategoryId,
          ownedBudgetCategoryIds(tx, budgetId, userId),
        ),
      ),
    )
    .returning()
}

export function updateTransactionPaidById(
  tx: DbTransaction,
  transactionId: string,
  budgetId: string,
  userId: string,
  isPaid: boolean,
) {
  return tx
    .update(transaction)
    .set({ isPaid })
    .where(
      and(
        eq(transaction.id, transactionId),
        inArray(
          transaction.budgetCategoryId,
          ownedBudgetCategoryIds(tx, budgetId, userId),
        ),
      ),
    )
    .returning()
}

export function deleteTransactionById(
  tx: DbTransaction,
  transactionId: string,
  budgetId: string,
  userId: string,
) {
  return tx
    .delete(transaction)
    .where(
      and(
        eq(transaction.id, transactionId),
        inArray(
          transaction.budgetCategoryId,
          ownedBudgetCategoryIds(tx, budgetId, userId),
        ),
      ),
    )
}

export async function insertTransactionAtEnd(
  tx: DbTransaction,
  values: Omit<typeof transaction.$inferInsert, 'sortOrder'>,
  budgetId: string,
  userId: string,
) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${values.budgetCategoryId}))`,
  )

  const [lastTransaction] = await tx
    .select({ sortOrder: transaction.sortOrder })
    .from(transaction)
    .innerJoin(
      budgetCategory,
      eq(transaction.budgetCategoryId, budgetCategory.id),
    )
    .innerJoin(budget, eq(budgetCategory.budgetId, budget.id))
    .where(
      and(
        eq(transaction.budgetCategoryId, values.budgetCategoryId),
        eq(budget.id, budgetId),
        eq(budget.userId, userId),
      ),
    )
    .orderBy(desc(transaction.sortOrder))
    .limit(1)

  return tx
    .insert(transaction)
    .values({ ...values, sortOrder: nextTransactionSortOrder(lastTransaction) })
    .returning()
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

export async function listBudgetCategoryIds(
  tx: DbTransaction,
  budgetId: string,
  userId: string,
) {
  return tx
    .select({ id: budgetCategory.id })
    .from(budgetCategory)
    .innerJoin(budget, eq(budgetCategory.budgetId, budget.id))
    .where(and(eq(budget.id, budgetId), eq(budget.userId, userId)))
    .orderBy(asc(budgetCategory.sortOrder), asc(budgetCategory.id))
}

export function listTransactionIds(
  tx: DbTransaction,
  budgetCategoryId: string,
  budgetId: string,
  userId: string,
) {
  return tx
    .select({ id: transaction.id })
    .from(transaction)
    .innerJoin(
      budgetCategory,
      eq(transaction.budgetCategoryId, budgetCategory.id),
    )
    .innerJoin(budget, eq(budgetCategory.budgetId, budget.id))
    .where(
      and(
        eq(transaction.budgetCategoryId, budgetCategoryId),
        eq(budget.id, budgetId),
        eq(budget.userId, userId),
      ),
    )
    .orderBy(asc(transaction.sortOrder), asc(transaction.id))
}

export async function updateTransactionPositions(
  tx: DbTransaction,
  transactionId: string,
  targetBudgetCategoryId: string,
  budgetId: string,
  userId: string,
  sourceIds: readonly string[],
  targetIds: readonly string[],
) {
  await tx
    .update(transaction)
    .set({ budgetCategoryId: targetBudgetCategoryId })
    .where(
      and(
        eq(transaction.id, transactionId),
        inArray(
          transaction.budgetCategoryId,
          ownedBudgetCategoryIds(tx, budgetId, userId),
        ),
      ),
    )

  const positions = new Map([
    ...sourceIds.map((id, sortOrder) => [id, sortOrder] as const),
    ...targetIds.map((id, sortOrder) => [id, sortOrder] as const),
  ])
  const sqlChunks: SQL[] = [
    sql`(case`,
    ...[...positions].map(
      ([id, sortOrder]) =>
        sql`when ${transaction.id} = ${id} then ${sortOrder}`,
    ),
    sql`end)::integer`,
  ]

  return tx
    .update(transaction)
    .set({ sortOrder: sql.join(sqlChunks, sql.raw(' ')) })
    .where(
      and(
        inArray(transaction.id, [...positions.keys()]),
        inArray(
          transaction.budgetCategoryId,
          ownedBudgetCategoryIds(tx, budgetId, userId),
        ),
      ),
    )
}
