import { database as db } from '#api-database'
import { ensureDefined } from 'narrowland'
import {
  isCompleteAllocationTargetSet,
  type AllocationTargetsInput,
} from '../../allocation-targets/rules'
import { updateBudgetCategoryAllocationTargetsTx } from '../budget-categories/repository'
import { findBudgetWithCategoriesTx, lockBudget } from '../repository'
import { OperationErrorCode } from '../result'

export class InvalidBudgetAllocationTargetsError extends Error {
  constructor() {
    super(
      'Allocation targets must include every expense BudgetCategory and total 100.0%',
    )
    this.name = 'InvalidBudgetAllocationTargetsError'
  }
}

export async function saveBudgetAllocationTargets(
  budgetId: string,
  userId: string,
  data: AllocationTargetsInput,
): Promise<{ error?: typeof OperationErrorCode.NotFound }> {
  return db.transaction(async (tx) => {
    await lockBudget(tx, budgetId, userId)
    const found = await findBudgetWithCategoriesTx(tx, budgetId, userId)
    if (!found) return { error: OperationErrorCode.NotFound }

    const expenseCategories = ensureDefined(found).budgetCategories.filter(
      ({ category }) => category.type === 'expense',
    )
    if (!data.enabled) {
      await updateBudgetCategoryAllocationTargetsTx(
        tx,
        budgetId,
        userId,
        expenseCategories.map(({ id }) => ({
          budgetCategoryId: id,
          allocationTarget: null,
        })),
      )
      return {}
    }

    if (
      !isCompleteAllocationTargetSet(
        data.targets,
        expenseCategories.map(({ id }) => id),
      )
    ) {
      throw new InvalidBudgetAllocationTargetsError()
    }

    await updateBudgetCategoryAllocationTargetsTx(
      tx,
      budgetId,
      userId,
      data.targets.map(({ categoryId, value }) => ({
        budgetCategoryId: categoryId,
        allocationTarget: value.toFixed(1),
      })),
    )
    return {}
  })
}
