import { db } from '$lib/server/db'
import {
  findBudgetById,
  findMonthlyBudget,
  insertBudget,
  insertCategories,
  listBudgetsByUser,
} from './repository'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export class DuplicateMonthlyBudgetError extends Error {
  constructor() {
    super('A monthly budget already exists for this month and year')
    this.name = 'DuplicateMonthlyBudgetError'
  }
}

function defaultCategories(budgetId: string) {
  return [
    { budgetId, name: 'Income', type: 'income' as const, sortOrder: 0 },
    { budgetId, name: 'Expenses', type: 'expense' as const, sortOrder: 1 },
  ]
}

export async function createMonthlyBudget(
  userId: string,
  { month, year }: { month: number; year: number },
) {
  const existing = await findMonthlyBudget(userId, month, year)
  if (existing) {
    throw new DuplicateMonthlyBudgetError()
  }

  const name = `${MONTH_NAMES[month - 1]} ${year}`

  return db.transaction(async (tx) => {
    const [inserted] = await insertBudget(tx, {
      userId,
      name,
      type: 'monthly',
      month,
      year,
    })
    await insertCategories(tx, defaultCategories(inserted.id))
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
    await insertCategories(tx, defaultCategories(inserted.id))
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
