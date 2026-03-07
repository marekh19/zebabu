import * as m from '$lib/paraglide/messages'
import { db } from '$lib/server/db'
import { ensureDefined } from 'narrowland'
import {
  findBudgetById,
  findCategoryDefinitionsByName,
  findMonthlyBudget,
  insertBudget,
  insertBudgetCategories,
  insertCategoryDefinitions,
  listBudgetsByUser,
} from './repository'

export class DuplicateMonthlyBudgetError extends Error {
  constructor() {
    super('A monthly budget already exists for this month and year')
    this.name = 'DuplicateMonthlyBudgetError'
  }
}

function getDefaultCategories() {
  return [
    {
      name: m.category_default_income(),
      type: 'income' as const,
      sortOrder: 0,
    },
    {
      name: m.category_default_expense(),
      type: 'expense' as const,
      sortOrder: 1,
    },
  ]
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function createDefaultBudgetCategories(
  tx: DbTransaction,
  userId: string,
  budgetId: string,
) {
  const categories = getDefaultCategories()

  await insertCategoryDefinitions(
    tx,
    categories.map(({ name, type }) => ({ userId, name, type })),
  )

  const names = categories.map((c) => c.name)
  const definitions = await findCategoryDefinitionsByName(tx, userId, names)
  const idsByName = new Map(definitions.map((d) => [d.name, d.id]))

  await insertBudgetCategories(
    tx,
    categories.map(({ name, sortOrder }) => ({
      budgetId,
      categoryId: ensureDefined(idsByName.get(name)),
      sortOrder,
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
    await createDefaultBudgetCategories(tx, userId, inserted.id)
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
    await createDefaultBudgetCategories(tx, userId, inserted.id)
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
