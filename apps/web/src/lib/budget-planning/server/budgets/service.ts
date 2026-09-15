import {
  areDefaultAllocationTargetsEnabled,
  isCompleteAllocationTargetSet,
  type AllocationTargetsInput,
} from '$lib/budget-planning/allocation-targets/rules'
import { BudgetType } from '$lib/budget-planning/budgets/types'
import type {
  AvailableCategory,
  BudgetDetail,
} from '$lib/budget-planning/model'
import {
  findCategoriesByUserTx,
  findCategoriesNotInBudget,
  findCategoryByIdTx,
  lockUserCategorySetTx,
} from '$lib/budget-planning/server/persistence/category-repository'
import { OperationErrorCode } from '$lib/operation-result'
import {
  database as db,
  type DbTransaction,
} from '$lib/server/persistence/database'
import { ensureDefined } from 'narrowland'
import {
  toAvailableCategory,
  toBudgetDetail,
  toBudgetListItem,
} from '../model-mappers'
import {
  deleteBudgetById,
  deleteTransactionById,
  findBudgetById,
  findBudgetWithCategoriesTx,
  findMonthlyBudget,
  findOwnedBudget,
  findOwnedBudgetCategory,
  findOwnedTransaction,
  findScenarioBudget,
  insertBudget,
  insertBudgetCategories,
  insertTransactionAtEnd,
  insertTransactions,
  listBudgetCategoryIds,
  listBudgetsByUser,
  listTransactionIds,
  lockBudget,
  lockUserBudgetSet,
  updateBudgetCategoryAllocationTargetsTx,
  updateBudgetCategorySortOrders,
  updateTransactionById,
  updateTransactionPaidById,
  updateTransactionPositions,
} from '../persistence/budget-repository'
import { positionTransactionIds } from './transaction-rules'

export class DuplicateMonthlyBudgetError extends Error {
  constructor() {
    super('A monthly budget already exists for this month and year')
    this.name = 'DuplicateMonthlyBudgetError'
  }
}

export class DuplicateScenarioBudgetError extends Error {
  constructor() {
    super('A scenario budget with this name already exists')
    this.name = 'DuplicateScenarioBudgetError'
  }
}

export class InvalidBudgetAllocationTargetsError extends Error {
  constructor() {
    super(
      'Allocation targets must include every expense BudgetCategory and total 100.0%',
    )
    this.name = 'InvalidBudgetAllocationTargetsError'
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  if ('code' in error && error.code === '23505') return true
  if ('errno' in error && error.errno === '23505') return true
  return 'cause' in error && isUniqueViolation(error.cause)
}

async function linkUserCategoriesToBudget(
  tx: DbTransaction,
  userId: string,
  budgetId: string,
  useDefaultAllocationTargets: boolean,
) {
  await lockUserCategorySetTx(tx, userId)
  const categories = await findCategoriesByUserTx(tx, userId)

  if (categories.length === 0) return

  const expenseCategories = categories.filter(({ type }) => type === 'expense')
  const defaultsComplete = areDefaultAllocationTargetsEnabled(expenseCategories)

  await insertBudgetCategories(
    tx,
    categories.map((cat, index) => ({
      budgetId,
      categoryId: cat.id,
      sortOrder: index,
      allocationTarget:
        useDefaultAllocationTargets &&
        defaultsComplete &&
        cat.type === 'expense'
          ? cat.defaultAllocationTarget
          : null,
    })),
  )
}

export async function createMonthlyBudget(
  userId: string,
  {
    month,
    year,
    useDefaultAllocationTargets,
  }: {
    month: number
    year: number
    useDefaultAllocationTargets: boolean
  },
) {
  try {
    return await db.transaction(async (tx) => {
      await lockUserBudgetSet(tx, userId)
      const existing = await findMonthlyBudget(userId, month, year, tx)
      if (existing) throw new DuplicateMonthlyBudgetError()

      const [inserted] = await insertBudget(tx, {
        userId,
        name: null,
        type: BudgetType.Monthly,
        month,
        year,
      })
      await linkUserCategoriesToBudget(
        tx,
        userId,
        inserted.id,
        useDefaultAllocationTargets,
      )
      return { id: inserted.id }
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateMonthlyBudgetError()
    throw error
  }
}

export async function createScenarioBudget(
  userId: string,
  {
    name,
    useDefaultAllocationTargets,
  }: { name: string; useDefaultAllocationTargets: boolean },
) {
  try {
    return await db.transaction(async (tx) => {
      await lockUserBudgetSet(tx, userId)
      const existing = await findScenarioBudget(userId, name, tx)
      if (existing) throw new DuplicateScenarioBudgetError()

      const [inserted] = await insertBudget(tx, {
        userId,
        name,
        type: BudgetType.Scenario,
        month: null,
        year: null,
      })
      await linkUserCategoriesToBudget(
        tx,
        userId,
        inserted.id,
        useDefaultAllocationTargets,
      )
      return { id: inserted.id }
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateScenarioBudgetError()
    throw error
  }
}

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

export async function deleteBudget(
  budgetId: string,
  userId: string,
): Promise<{ error?: typeof OperationErrorCode.NotFound }> {
  const [deleted] = await deleteBudgetById(budgetId, userId)
  return deleted ? {} : { error: OperationErrorCode.NotFound }
}

export function listBudgets(userId: string) {
  return listBudgetsByUser(userId).then((budgets) =>
    budgets.map(toBudgetListItem),
  )
}

type DuplicateBudgetTarget = {
  type: BudgetType
  month?: number
  year?: number
  name?: string
}

type DuplicateBudgetResult =
  | { budget: { id: string }; error?: never }
  | { budget?: never; error: typeof OperationErrorCode.NotFound }

export async function duplicateBudget(
  sourceBudgetId: string,
  userId: string,
  target: DuplicateBudgetTarget,
): Promise<DuplicateBudgetResult> {
  try {
    return await db.transaction(async (tx) => {
      await lockUserBudgetSet(tx, userId)
      await lockBudget(tx, sourceBudgetId, userId)
      const source = await findBudgetById(sourceBudgetId, userId, tx)
      if (!source) return { error: OperationErrorCode.NotFound }

      if (target.type === BudgetType.Monthly) {
        const existing = await findMonthlyBudget(
          userId,
          ensureDefined(target.month),
          ensureDefined(target.year),
          tx,
        )
        if (existing) throw new DuplicateMonthlyBudgetError()
      } else {
        const existing = await findScenarioBudget(
          userId,
          ensureDefined(target.name),
          tx,
        )
        if (existing) throw new DuplicateScenarioBudgetError()
      }

      const [inserted] = await insertBudget(tx, {
        userId,
        type: target.type,
        month:
          target.type === BudgetType.Monthly ? (target.month ?? null) : null,
        year: target.type === BudgetType.Monthly ? (target.year ?? null) : null,
        name:
          target.type === BudgetType.Scenario ? (target.name ?? null) : null,
      })

      if (source.budgetCategories.length > 0) {
        const newCategories = await insertBudgetCategories(
          tx,
          source.budgetCategories.map((bc) => ({
            budgetId: inserted.id,
            categoryId: bc.categoryId,
            sortOrder: bc.sortOrder,
            allocationTarget: bc.allocationTarget,
          })),
        )

        const allTransactions = source.budgetCategories.flatMap((bc, i) =>
          bc.transactions.map((t) => ({
            budgetCategoryId: ensureDefined(newCategories[i]).id,
            name: t.name,
            note: t.note,
            amount: t.amount,
            isPaid: false,
            sortOrder: t.sortOrder,
          })),
        )

        if (allTransactions.length > 0) {
          await insertTransactions(tx, allTransactions)
        }
      }

      return { budget: { id: inserted.id } }
    })
  } catch (error) {
    if (!isUniqueViolation(error)) throw error
    if (target.type === BudgetType.Monthly) {
      throw new DuplicateMonthlyBudgetError()
    }
    throw new DuplicateScenarioBudgetError()
  }
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

type GetBudgetDetailResult =
  | {
      budget: BudgetDetail
      availableCategories: readonly AvailableCategory[]
      error?: never
    }
  | {
      budget?: never
      availableCategories?: never
      error: typeof OperationErrorCode.NotFound
    }

export async function getBudgetDetail(
  budgetId: string,
  userId: string,
): Promise<GetBudgetDetailResult> {
  const found = await findBudgetById(budgetId, userId)
  if (!found) return { error: OperationErrorCode.NotFound }

  const availableCategories = await findCategoriesNotInBudget(userId, budgetId)

  return {
    budget: toBudgetDetail(ensureDefined(found)),
    availableCategories: availableCategories.map(toAvailableCategory),
  }
}

type EditableTransactionData = {
  name: string
  amount: number
  isPaid: boolean
  note?: string
}

export async function createTransaction(
  budgetId: string,
  userId: string,
  budgetCategoryId: string,
  data: EditableTransactionData,
) {
  return db.transaction(async (tx) => {
    const destination = await findOwnedBudgetCategory(
      tx,
      budgetCategoryId,
      budgetId,
      userId,
    )
    if (!destination) return { error: OperationErrorCode.NotFound }

    await insertTransactionAtEnd(
      tx,
      {
        budgetCategoryId,
        name: data.name,
        amount: String(data.amount),
        isPaid: data.isPaid,
        note: data.note || null,
      },
      budgetId,
      userId,
    )

    return {}
  })
}

export async function updateTransaction(
  budgetId: string,
  userId: string,
  transactionId: string,
  data: EditableTransactionData,
) {
  return db.transaction(async (tx) => {
    const found = await findOwnedTransaction(
      tx,
      transactionId,
      budgetId,
      userId,
    )
    if (!found) return { error: OperationErrorCode.NotFound }

    await updateTransactionById(tx, transactionId, budgetId, userId, {
      name: data.name,
      amount: String(data.amount),
      isPaid: data.isPaid,
      note: data.note || null,
    })

    return {}
  })
}

export async function updateTransactionPaid(
  budgetId: string,
  userId: string,
  transactionId: string,
  isPaid: boolean,
) {
  return db.transaction(async (tx) => {
    const found = await findOwnedTransaction(
      tx,
      transactionId,
      budgetId,
      userId,
    )
    if (!found) return { error: OperationErrorCode.NotFound }

    await updateTransactionPaidById(tx, transactionId, budgetId, userId, isPaid)

    return {}
  })
}

type PositionTransactionCommand = Readonly<{
  budgetId: string
  userId: string
  transactionId: string
  targetBudgetCategoryId: string
  targetIndex: number
}>

export async function positionTransaction({
  budgetId,
  userId,
  transactionId,
  targetBudgetCategoryId,
  targetIndex,
}: PositionTransactionCommand) {
  return db.transaction(async (tx) => {
    await lockBudget(tx, budgetId, userId)

    const sourceTransaction = await findOwnedTransaction(
      tx,
      transactionId,
      budgetId,
      userId,
    )
    if (!sourceTransaction) return { error: OperationErrorCode.NotFound }

    const targetBudgetCategory = await findOwnedBudgetCategory(
      tx,
      targetBudgetCategoryId,
      budgetId,
      userId,
    )
    if (!targetBudgetCategory) return { error: OperationErrorCode.NotFound }

    const sourceRows = await listTransactionIds(
      tx,
      sourceTransaction.budgetCategoryId,
      budgetId,
      userId,
    )
    const sameCategory =
      sourceTransaction.budgetCategoryId === targetBudgetCategoryId
    const targetRows = sameCategory
      ? sourceRows
      : await listTransactionIds(tx, targetBudgetCategoryId, budgetId, userId)
    const positions = positionTransactionIds(
      sourceRows.map(({ id }) => id),
      targetRows.map(({ id }) => id),
      transactionId,
      targetIndex,
      sameCategory,
    )
    if (!positions) return { error: OperationErrorCode.InvalidPosition }

    await updateTransactionPositions(
      tx,
      transactionId,
      targetBudgetCategoryId,
      budgetId,
      userId,
      positions.sourceIds,
      positions.targetIds,
    )

    return {}
  })
}

export async function deleteTransaction(
  budgetId: string,
  userId: string,
  transactionId: string,
) {
  return db.transaction(async (tx) => {
    const found = await findOwnedTransaction(
      tx,
      transactionId,
      budgetId,
      userId,
    )
    if (!found) return { error: OperationErrorCode.NotFound }

    await deleteTransactionById(tx, transactionId, budgetId, userId)
    return {}
  })
}
