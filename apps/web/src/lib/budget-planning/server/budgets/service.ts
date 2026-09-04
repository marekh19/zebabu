import { BudgetType } from '$lib/budget-planning/budgets/types'
import type {
  AvailableCategory,
  BudgetDetail,
} from '$lib/budget-planning/model'
import {
  findCategoriesByUserTx,
  findCategoriesNotInBudget,
  findCategoryById,
} from '$lib/budget-planning/server/persistence/category-repository'
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
  findBudgetOwner,
  findMonthlyBudget,
  findOwnedBudgetCategory,
  findOwnedTransaction,
  findScenarioBudget,
  insertBudget,
  insertBudgetCategories,
  insertTransactionAtEnd,
  insertTransactions,
  listBudgetsByUser,
  updateBudgetCategorySortOrders,
  updateTransactionById,
  updateTransactionPaidById,
} from '../persistence/budget-repository'

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

function checkOwnership(
  found: { userId: string } | null | undefined,
  userId: string,
): 'not_found' | 'access_denied' | null {
  if (!found) return 'not_found'
  if (found.userId !== userId) return 'access_denied'
  return null
}

async function linkUserCategoriesToBudget(
  tx: DbTransaction,
  userId: string,
  budgetId: string,
) {
  const categories = await findCategoriesByUserTx(tx, userId)

  if (categories.length === 0) return

  await insertBudgetCategories(
    tx,
    categories.map((cat, index) => ({
      budgetId,
      categoryId: cat.id,
      sortOrder: index,
    })),
  )
}

export async function createMonthlyBudget(
  userId: string,
  { month, year }: { month: number; year: number },
) {
  return db.transaction(async (tx) => {
    const existing = await findMonthlyBudget(userId, month, year, tx)
    if (existing) throw new DuplicateMonthlyBudgetError()

    const [inserted] = await insertBudget(tx, {
      userId,
      name: null,
      type: BudgetType.Monthly,
      month,
      year,
    })
    await linkUserCategoriesToBudget(tx, userId, inserted.id)
    return { id: inserted.id }
  })
}

export async function createScenarioBudget(
  userId: string,
  { name }: { name: string },
) {
  return db.transaction(async (tx) => {
    const existing = await findScenarioBudget(userId, name, tx)
    if (existing) throw new DuplicateScenarioBudgetError()

    const [inserted] = await insertBudget(tx, {
      userId,
      name,
      type: BudgetType.Scenario,
      month: null,
      year: null,
    })
    await linkUserCategoriesToBudget(tx, userId, inserted.id)
    return { id: inserted.id }
  })
}

export async function reorderBudgetCategories(
  budgetId: string,
  userId: string,
  items: { id: string; sortOrder: number }[],
): Promise<{ error?: 'not_found' | 'access_denied' }> {
  const found = await findBudgetOwner(budgetId)
  const ownershipError = checkOwnership(found, userId)
  if (ownershipError) return { error: ownershipError }

  await db.transaction((tx) =>
    updateBudgetCategorySortOrders(tx, budgetId, items),
  )

  return {}
}

export async function deleteBudget(
  budgetId: string,
  userId: string,
): Promise<{ error?: 'not_found' | 'access_denied' }> {
  const found = await findBudgetOwner(budgetId)
  const ownershipError = checkOwnership(found, userId)
  if (ownershipError) return { error: ownershipError }

  await deleteBudgetById(budgetId)

  return {}
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
  | { budget?: never; error: 'not_found' | 'access_denied' }

export async function duplicateBudget(
  sourceBudgetId: string,
  userId: string,
  target: DuplicateBudgetTarget,
): Promise<DuplicateBudgetResult> {
  const found = await findBudgetById(sourceBudgetId)
  const ownershipError = checkOwnership(found, userId)
  if (ownershipError) return { error: ownershipError }
  const source = ensureDefined(found)

  if (target.type === BudgetType.Monthly) {
    const existing = await findMonthlyBudget(
      userId,
      ensureDefined(target.month),
      ensureDefined(target.year),
    )
    if (existing) throw new DuplicateMonthlyBudgetError()
  } else {
    const existing = await findScenarioBudget(
      userId,
      ensureDefined(target.name),
    )
    if (existing) throw new DuplicateScenarioBudgetError()
  }

  const newBudget = await db.transaction(async (tx) => {
    const [inserted] = await insertBudget(tx, {
      userId,
      type: target.type,
      month: target.type === BudgetType.Monthly ? (target.month ?? null) : null,
      year: target.type === BudgetType.Monthly ? (target.year ?? null) : null,
      name: target.type === BudgetType.Scenario ? (target.name ?? null) : null,
    })

    if (source.budgetCategories.length > 0) {
      const newCategories = await insertBudgetCategories(
        tx,
        source.budgetCategories.map((bc) => ({
          budgetId: inserted.id,
          categoryId: bc.categoryId,
          sortOrder: bc.sortOrder,
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

    return inserted
  })

  return { budget: { id: newBudget.id } }
}

export async function addBudgetCategory(
  budgetId: string,
  userId: string,
  categoryId: string,
): Promise<{ error?: 'not_found' | 'access_denied' | 'category_not_found' }> {
  const foundBudget = await findBudgetOwner(budgetId)
  const ownershipError = checkOwnership(foundBudget, userId)
  if (ownershipError) return { error: ownershipError }

  const foundCategory = await findCategoryById(categoryId, userId)
  if (!foundCategory) return { error: 'category_not_found' }

  const currentBudget = await findBudgetById(budgetId)
  const sortOrder = currentBudget?.budgetCategories.length ?? 0

  await db.transaction((tx) =>
    insertBudgetCategories(tx, [{ budgetId, categoryId, sortOrder }]),
  )

  return {}
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
      error: 'not_found' | 'access_denied'
    }

export async function getBudgetDetail(
  budgetId: string,
  userId: string,
): Promise<GetBudgetDetailResult> {
  const found = await findBudgetById(budgetId)
  const ownershipError = checkOwnership(found, userId)
  if (ownershipError) return { error: ownershipError }

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
    if (!destination) return { error: 'not_found' as const }

    await insertTransactionAtEnd(tx, {
      budgetCategoryId,
      name: data.name,
      amount: String(data.amount),
      isPaid: data.isPaid,
      note: data.note || null,
    })

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
    if (!found) return { error: 'not_found' as const }

    await updateTransactionById(tx, transactionId, {
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
    if (!found) return { error: 'not_found' as const }

    await updateTransactionPaidById(tx, transactionId, isPaid)

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
    if (!found) return { error: 'not_found' as const }

    await deleteTransactionById(tx, transactionId)
    return {}
  })
}
