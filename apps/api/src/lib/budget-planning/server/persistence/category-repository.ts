import type { CategoryColor } from '$lib/budget-planning/categories/types'
import {
  database as db,
  type DbTransaction,
} from '$lib/server/persistence/database'
import { budgetPlanningSchema } from '$lib/server/persistence/schema'
import { and, asc, count, eq, inArray, isNull, ne, sql } from 'drizzle-orm'

const { budgetCategory, category } = budgetPlanningSchema

export async function findCategoriesWithBudgetUsageByUser(userId: string) {
  return db
    .select({
      id: category.id,
      userId: category.userId,
      name: category.name,
      type: category.type,
      color: category.color,
      defaultAllocationTarget: category.defaultAllocationTarget,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      budgetUsageCount: count(budgetCategory.id),
    })
    .from(category)
    .leftJoin(budgetCategory, eq(category.id, budgetCategory.categoryId))
    .where(eq(category.userId, userId))
    .groupBy(
      category.id,
      category.userId,
      category.name,
      category.type,
      category.color,
      category.defaultAllocationTarget,
      category.createdAt,
      category.updatedAt,
    )
    .orderBy(asc(category.name))
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

export function lockUserCategorySetTx(tx: DbTransaction, userId: string) {
  return tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${'category-set:' + userId}))`,
  )
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

export function findCategoryByIdTx(
  tx: DbTransaction,
  categoryId: string,
  userId: string,
) {
  return tx.query.category.findFirst({
    where: and(eq(category.id, categoryId), eq(category.userId, userId)),
  })
}

export async function countCategoriesByTypeTx(
  tx: DbTransaction,
  userId: string,
  type: 'income' | 'expense',
) {
  const [row] = await tx
    .select({ value: count() })
    .from(category)
    .where(and(eq(category.userId, userId), eq(category.type, type)))
  return row?.value ?? 0
}

export async function findBudgetCategoryByCategoryIdTx(
  tx: DbTransaction,
  categoryId: string,
  userId: string,
) {
  const [found] = await tx
    .select({ id: budgetCategory.id })
    .from(budgetCategory)
    .innerJoin(category, eq(budgetCategory.categoryId, category.id))
    .where(
      and(
        eq(budgetCategory.categoryId, categoryId),
        eq(category.userId, userId),
      ),
    )
    .limit(1)
  return found
}

export function findCategoryById(categoryId: string, userId: string) {
  return db.query.category.findFirst({
    where: and(eq(category.id, categoryId), eq(category.userId, userId)),
  })
}

export function findCategoriesNotInBudget(userId: string, budgetId: string) {
  return db
    .select({
      id: category.id,
      userId: category.userId,
      name: category.name,
      type: category.type,
      color: category.color,
      defaultAllocationTarget: category.defaultAllocationTarget,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })
    .from(category)
    .leftJoin(
      budgetCategory,
      and(
        eq(category.id, budgetCategory.categoryId),
        eq(budgetCategory.budgetId, budgetId),
      ),
    )
    .where(and(eq(category.userId, userId), isNull(budgetCategory.id)))
    .orderBy(asc(category.name))
}

export function deleteCategoryTx(
  tx: DbTransaction,
  categoryId: string,
  userId: string,
) {
  return tx
    .delete(category)
    .where(and(eq(category.id, categoryId), eq(category.userId, userId)))
}

export function updateCategoryTx(
  tx: DbTransaction,
  categoryId: string,
  userId: string,
  data: { name: string; color: CategoryColor },
) {
  return tx
    .update(category)
    .set({ name: data.name, color: data.color })
    .where(and(eq(category.id, categoryId), eq(category.userId, userId)))
    .returning()
}

export function updateCategoryDefaultAllocationTargetsTx(
  tx: DbTransaction,
  userId: string,
  targets: readonly {
    categoryId: string
    defaultAllocationTarget: string | null
  }[],
) {
  if (targets.length === 0) return

  const ids = targets.map(({ categoryId }) => categoryId)
  const cases = targets.map(
    ({ categoryId, defaultAllocationTarget }) =>
      sql`when ${category.id} = ${categoryId} then ${defaultAllocationTarget}`,
  )

  return tx
    .update(category)
    .set({
      defaultAllocationTarget: sql`(case ${sql.join(cases, sql.raw(' '))} end)::numeric(4, 1)`,
    })
    .where(and(eq(category.userId, userId), inArray(category.id, ids)))
}
