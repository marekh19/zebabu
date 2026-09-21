import { database as db } from '#api-database'
import { ensureDefined } from 'narrowland'
import { findCategoryByIdTx } from '../../categories/repository'
import {
  findBudgetWithCategoriesTx,
  findOwnedBudget,
  lockBudget,
} from '../repository'
import { OperationErrorCode } from '../result'
import {
  insertBudgetCategories,
  listBudgetCategoryIds,
  updateBudgetCategorySortOrders,
} from './repository'

export async function reorderBudgetCategories(
  budgetId: string,
  userId: string,
  items: { id: string; sortOrder: number }[],
): Promise<{
  error?:
    | typeof OperationErrorCode.NotFound
    | typeof OperationErrorCode.InvalidPosition
}> {
  return db.transaction(async (tx) => {
    await lockBudget(tx, budgetId, userId)
    const found = await findOwnedBudget(budgetId, userId, tx)
    if (!found) return { error: OperationErrorCode.NotFound }

    const existingIds = (await listBudgetCategoryIds(tx, budgetId, userId)).map(
      ({ id }) => id,
    )
    const submittedIds = items.map(({ id }) => id)
    const submittedPositions = items.map(({ sortOrder }) => sortOrder)
    const completePermutation =
      submittedIds.length === existingIds.length &&
      new Set(submittedIds).size === existingIds.length &&
      existingIds.every((id) => submittedIds.includes(id)) &&
      new Set(submittedPositions).size === existingIds.length &&
      submittedPositions.every(
        (position) => position >= 0 && position < existingIds.length,
      )

    if (!completePermutation) {
      return { error: OperationErrorCode.InvalidPosition }
    }

    await updateBudgetCategorySortOrders(tx, budgetId, userId, items)
    return {}
  })
}

export async function positionBudgetCategory(
  budgetId: string,
  userId: string,
  budgetCategoryId: string,
  targetIndex: number,
): Promise<{
  error?:
    | typeof OperationErrorCode.NotFound
    | typeof OperationErrorCode.InvalidPosition
}> {
  return db.transaction(async (tx) => {
    await lockBudget(tx, budgetId, userId)
    if (!(await findOwnedBudget(budgetId, userId, tx))) {
      return { error: OperationErrorCode.NotFound }
    }

    const ids = (await listBudgetCategoryIds(tx, budgetId, userId)).map(
      ({ id }) => id,
    )
    if (!ids.includes(budgetCategoryId)) {
      return { error: OperationErrorCode.NotFound }
    }
    if (targetIndex < 0 || targetIndex >= ids.length) {
      return { error: OperationErrorCode.InvalidPosition }
    }

    const remaining = ids.filter((id) => id !== budgetCategoryId)
    const ordered = [
      ...remaining.slice(0, targetIndex),
      budgetCategoryId,
      ...remaining.slice(targetIndex),
    ]
    await updateBudgetCategorySortOrders(
      tx,
      budgetId,
      userId,
      ordered.map((id, sortOrder) => ({ id, sortOrder })),
    )
    return {}
  })
}

export async function addBudgetCategory(
  budgetId: string,
  userId: string,
  categoryId: string,
): Promise<{
  error?: typeof OperationErrorCode.NotFound
}> {
  return db.transaction(async (tx) => {
    await lockBudget(tx, budgetId, userId)

    const foundBudget = await findBudgetWithCategoriesTx(tx, budgetId, userId)
    if (!foundBudget) return { error: OperationErrorCode.NotFound }

    const foundCategory = await findCategoryByIdTx(tx, categoryId, userId)
    if (!foundCategory) return { error: OperationErrorCode.NotFound }

    const budgetCategories = ensureDefined(foundBudget).budgetCategories
    const expenseCategories = budgetCategories.filter(
      ({ category }) => category.type === 'expense',
    )
    const targetsEnabled =
      expenseCategories.length > 0 &&
      expenseCategories.every(
        ({ allocationTarget }) => allocationTarget !== null,
      )

    await insertBudgetCategories(tx, [
      {
        budgetId,
        categoryId,
        sortOrder: budgetCategories.length,
        allocationTarget:
          foundCategory.type === 'expense' && targetsEnabled ? '0.0' : null,
      },
    ])

    return {}
  })
}
