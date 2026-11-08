import { database as db, type DbTransaction } from '#api-database'
import { ensureDefined } from 'narrowland'
import { areDefaultAllocationTargetsEnabled } from '../allocation-targets/rules'
import {
  findCategoriesByUserTx,
  findCategoriesNotInBudget,
  lockUserCategorySetTx,
} from '../categories/repository'
import type { AvailableCategory, BudgetDetail } from '../model'
import { insertBudgetCategories } from './budget-categories/repository'
import {
  toAvailableCategory,
  toBudgetDetail,
  toBudgetListItem,
} from './mapping'
import {
  deleteBudgetById,
  findBudgetById,
  findMonthlyBudget,
  findScenarioBudget,
  insertBudget,
  listBudgetsByUser,
  lockBudget,
  lockUserBudgetSet,
} from './repository'
import { OperationErrorCode } from './result'
import { insertTransactions } from './transactions/repository'
import { BudgetType } from './types'

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
