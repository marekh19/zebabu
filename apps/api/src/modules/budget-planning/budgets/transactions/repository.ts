import type { DbTransaction } from '#api-database'
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { budgetPlanningSchema } from '../../../../infrastructure/database/schema'
import { nextTransactionSortOrder } from './rules'

const { budget, budgetCategory, transaction } = budgetPlanningSchema

export function insertTransactions(
  tx: DbTransaction,
  values: (typeof transaction.$inferInsert)[],
) {
  return tx.insert(transaction).values(values)
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
