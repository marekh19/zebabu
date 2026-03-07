import { findCategoriesByUser } from '$lib/server/categories/repository'
import { db } from '$lib/server/db'
import {
  findBudgetById,
  findMonthlyBudget,
  insertBudget,
  insertBudgetCategories,
  listBudgetsByUser,
} from './repository'

export class DuplicateMonthlyBudgetError extends Error {
  constructor() {
    super('A monthly budget already exists for this month and year')
    this.name = 'DuplicateMonthlyBudgetError'
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
  const existing = await findMonthlyBudget(userId, month, year)
  if (existing) {
    throw new DuplicateMonthlyBudgetError()
  }

  return db.transaction(async (tx) => {
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

export function listBudgets(userId: string) {
  return listBudgetsByUser(userId)
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
