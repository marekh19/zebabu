import { findCategoriesByUser } from '$lib/server/categories/repository'
import { db } from '$lib/server/db'
import { ensureDefined } from 'narrowland'
import {
  deleteBudgetById,
  findBudgetById,
  findBudgetOwner,
  findMonthlyBudget,
  findScenarioBudget,
  insertBudget,
  insertBudgetCategories,
  insertTransactions,
  listBudgetsByUser,
  updateBudgetCategorySortOrders,
} from './repository'

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

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function linkUserCategoriesToBudget(
  tx: DbTransaction,
  userId: string,
  budgetId: string,
) {
  const categories = await findCategoriesByUser(tx, userId)

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
      type: 'monthly',
      month,
      year,
    })
    await linkUserCategoriesToBudget(tx, userId, inserted.id)
    return inserted
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
      type: 'scenario',
      month: null,
      year: null,
    })
    await linkUserCategoriesToBudget(tx, userId, inserted.id)
    return inserted
  })
}

export async function reorderBudgetCategories(
  budgetId: string,
  userId: string,
  items: { id: string; sortOrder: number }[],
): Promise<{ error?: 'not_found' | 'access_denied' }> {
  const found = await findBudgetOwner(budgetId)

  if (!found) {
    return { error: 'not_found' }
  }

  if (found.userId !== userId) {
    return { error: 'access_denied' }
  }

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

  if (!found) {
    return { error: 'not_found' }
  }

  if (found.userId !== userId) {
    return { error: 'access_denied' }
  }

  await deleteBudgetById(budgetId)

  return {}
}

export function listBudgets(userId: string) {
  return listBudgetsByUser(userId)
}

type DuplicateBudgetTarget = {
  type: 'monthly' | 'scenario'
  month?: number
  year?: number
  name?: string
}

type BudgetSelect = Awaited<ReturnType<typeof insertBudget>>[number]

type DuplicateBudgetResult =
  | { budget: BudgetSelect; error?: never }
  | { budget?: never; error: 'not_found' | 'access_denied' }

export async function duplicateBudget(
  sourceBudgetId: string,
  userId: string,
  target: DuplicateBudgetTarget,
): Promise<DuplicateBudgetResult> {
  const found = await findBudgetById(sourceBudgetId)

  if (!found) return { error: 'not_found' }
  if (found.userId !== userId) return { error: 'access_denied' }

  if (target.type === 'monthly') {
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
      month: target.type === 'monthly' ? (target.month ?? null) : null,
      year: target.type === 'monthly' ? (target.year ?? null) : null,
      name: target.type === 'scenario' ? (target.name ?? null) : null,
    })

    if (found.budgetCategories.length > 0) {
      const newCategories = await insertBudgetCategories(
        tx,
        found.budgetCategories.map((bc) => ({
          budgetId: inserted.id,
          categoryId: bc.categoryId,
          sortOrder: bc.sortOrder,
        })),
      )

      const allTransactions = found.budgetCategories.flatMap((bc, i) =>
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

  return { budget: newBudget }
}

type BudgetDetail = NonNullable<Awaited<ReturnType<typeof findBudgetById>>>

type GetBudgetDetailResult =
  | { budget: BudgetDetail; error?: never }
  | { budget?: never; error: 'not_found' | 'access_denied' }

export async function getBudgetDetail(
  budgetId: string,
  userId: string,
): Promise<GetBudgetDetailResult> {
  const found = await findBudgetById(budgetId)

  if (!found) {
    return { error: 'not_found' }
  }

  if (found.userId !== userId) {
    return { error: 'access_denied' }
  }

  return { budget: found }
}
