import type { DbTransaction } from '#api-database'
import { and, asc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { budgetPlanningSchema } from '../../../../infrastructure/database/schema'

const { budget, budgetCategory, category } = budgetPlanningSchema

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

export async function findOwnedBudgetCategory(
  tx: DbTransaction,
  budgetCategoryId: string,
  budgetId: string,
  userId: string,
) {
  const [found] = await tx
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
  return found
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
    .innerJoin(category, eq(budgetCategory.categoryId, category.id))
    .where(
      and(
        eq(budget.id, budgetId),
        eq(budget.userId, userId),
        eq(category.userId, userId),
      ),
    )
    .orderBy(asc(budgetCategory.sortOrder), asc(budgetCategory.id))
}
