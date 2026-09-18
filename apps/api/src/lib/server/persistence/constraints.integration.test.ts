import { testDatabase as database } from '$lib/server/persistence/database.test-helper'
import {
  budget,
  budgetCategory,
  category,
  transaction,
  user,
} from '$lib/server/persistence/schema'
import { afterAll, beforeEach, describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'

const testRunId = crypto.randomUUID()
const id = (name: string) => `constraint-${testRunId}-${name}`
const ids = {
  user: id('user'),
  budget: id('budget'),
  category: id('category'),
  budgetCategory: id('budget-category'),
}

async function cleanUp() {
  await database.delete(user).where(eq(user.id, ids.user))
}

async function seed() {
  await database.insert(user).values({
    id: ids.user,
    name: 'Constraint test',
    email: `${ids.user}@example.com`,
  })
  await database.insert(budget).values({
    id: ids.budget,
    userId: ids.user,
    type: 'scenario',
    name: 'Valid scenario',
  })
  await database.insert(category).values({
    id: ids.category,
    userId: ids.user,
    type: 'expense',
    name: 'Expense',
  })
  await database.insert(budgetCategory).values({
    id: ids.budgetCategory,
    budgetId: ids.budget,
    categoryId: ids.category,
  })
}

function violates(constraint: string) {
  return { cause: { errno: '23514', constraint } }
}

async function rejection(operation: () => PromiseLike<unknown>) {
  try {
    await operation()
  } catch (error) {
    return error
  }
  throw new Error('Expected database operation to fail')
}

describe('PostgreSQL domain constraints', () => {
  beforeEach(async () => {
    await cleanUp()
    await seed()
  })

  afterAll(async () => {
    await cleanUp()
  })

  it.each([
    [{ type: 'monthly' as const, month: 13, year: 2026, name: null }],
    [{ type: 'monthly' as const, month: 9, year: 1999, name: null }],
    [{ type: 'monthly' as const, month: 9, year: 2026, name: 'Named' }],
    [{ type: 'scenario' as const, month: null, year: null, name: ' ' }],
    [{ type: 'scenario' as const, month: 9, year: null, name: 'Named' }],
  ])('rejects an invalid Budget shape', async (values) => {
    expect(
      await rejection(() =>
        database.insert(budget).values({
          id: crypto.randomUUID(),
          userId: ids.user,
          ...values,
        }),
      ),
    ).toMatchObject(violates('budget_shape_check'))
  })

  it('rejects Category Allocation Targets outside 0.0–100.0', async () => {
    expect(
      await rejection(() =>
        database.insert(category).values({
          id: id('invalid-category'),
          userId: ids.user,
          type: 'expense',
          name: 'Invalid expense',
          defaultAllocationTarget: '100.1',
        }),
      ),
    ).toMatchObject(violates('category_default_allocation_target_check'))
  })

  it.each([
    [{ sortOrder: -1 }, 'budget_category_sort_order_check'],
    [{ allocationTarget: '-0.1' }, 'budget_category_allocation_target_check'],
  ])('rejects an invalid BudgetCategory', async (values, constraint) => {
    expect(
      await rejection(() =>
        database.insert(budgetCategory).values({
          id: crypto.randomUUID(),
          budgetId: ids.budget,
          categoryId: ids.category,
          ...values,
        }),
      ),
    ).toMatchObject(violates(constraint))
  })

  it.each([
    [{ amount: '0.00', sortOrder: 0 }, 'transaction_amount_check'],
    [{ amount: '1.00', sortOrder: -1 }, 'transaction_sort_order_check'],
  ])('rejects an invalid Transaction', async (values, constraint) => {
    expect(
      await rejection(() =>
        database.insert(transaction).values({
          id: crypto.randomUUID(),
          budgetCategoryId: ids.budgetCategory,
          name: 'Invalid transaction',
          ...values,
        }),
      ),
    ).toMatchObject(violates(constraint))
  })
})
