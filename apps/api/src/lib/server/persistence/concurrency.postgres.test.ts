import { BudgetType } from '$lib/budget-planning/budgets/types'
import {
  createMonthlyBudget,
  createScenarioBudget,
  duplicateBudget,
  DuplicateMonthlyBudgetError,
  DuplicateScenarioBudgetError,
  reorderBudgetCategories,
} from '$lib/budget-planning/server/budgets/service'
import { createCategory } from '$lib/budget-planning/server/categories/service'
import { ensureUserProvisioned } from '$lib/identity/server/provisioning'
import {
  budget,
  budgetCategory,
  category,
  transaction,
  user,
} from '$lib/server/persistence/schema'
import { afterAll, beforeEach, describe, expect, it } from 'bun:test'
import { asc, eq, inArray } from 'drizzle-orm'
import { testDatabase as database } from './database.test-helper'

const runId = crypto.randomUUID()
const id = (name: string) => `concurrency-${runId}-${name}`
const userId = id('user')

async function cleanUp() {
  await database.delete(user).where(eq(user.id, userId))
}

async function seedUser() {
  await database.insert(user).values({
    id: userId,
    name: 'Concurrency user',
    email: `${userId}@example.com`,
  })
}

function expectOneConflict(
  results: readonly PromiseSettledResult<unknown>[],
  conflict:
    typeof DuplicateMonthlyBudgetError | typeof DuplicateScenarioBudgetError,
) {
  expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
  const rejected = results.flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  )
  expect(rejected).toHaveLength(1)
  expect(rejected[0]).toBeInstanceOf(conflict)
}

describe('PostgreSQL concurrency boundaries', () => {
  beforeEach(async () => {
    await cleanUp()
    await seedUser()
  })

  afterAll(cleanUp)

  it('serializes duplicate monthly Budget creation', async () => {
    const command = () =>
      createMonthlyBudget(userId, {
        month: 9,
        year: 2026,
        useDefaultAllocationTargets: false,
      })

    const results = await Promise.allSettled([command(), command()])

    expectOneConflict(results, DuplicateMonthlyBudgetError)
    const budgets = await database
      .select({ id: budget.id })
      .from(budget)
      .where(eq(budget.userId, userId))
    expect(budgets).toHaveLength(1)
  })

  it('serializes duplicate scenario Budget creation', async () => {
    const command = () =>
      createScenarioBudget(userId, {
        name: 'Same scenario',
        useDefaultAllocationTargets: false,
      })

    const results = await Promise.allSettled([command(), command()])

    expectOneConflict(results, DuplicateScenarioBudgetError)
  })

  it('retries and serializes first-request provisioning after verification', async () => {
    await database
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, userId))
    await database.insert(category).values({
      id: id('existing-income'),
      userId,
      name: 'Existing income',
      type: 'income',
    })

    await Promise.all([
      ensureUserProvisioned(userId, 'en'),
      ensureUserProvisioned(userId, 'en'),
    ])

    const [provisioned] = await database
      .select({ isProvisioned: user.isProvisioned })
      .from(user)
      .where(eq(user.id, userId))
    const categories = await database
      .select({ type: category.type })
      .from(category)
      .where(eq(category.userId, userId))
    expect(provisioned?.isProvisioned).toBe(true)
    expect(categories.filter(({ type }) => type === 'income')).toHaveLength(1)
    expect(categories.filter(({ type }) => type === 'expense')).toHaveLength(1)
  })

  it('takes a coherent Category snapshot during Budget creation', async () => {
    const existingIds = [id('income'), id('expense')]
    await database.insert(category).values([
      {
        id: existingIds[0],
        userId,
        name: 'Income',
        type: 'income',
      },
      {
        id: existingIds[1],
        userId,
        name: 'Expense',
        type: 'expense',
      },
    ])

    const [createdBudget] = await Promise.all([
      createScenarioBudget(userId, {
        name: 'Snapshot',
        useDefaultAllocationTargets: false,
      }),
      createCategory(userId, {
        name: 'Concurrent',
        type: 'expense',
        color: 'slate',
      }),
    ])
    const allCategoryIds = (
      await database
        .select({ id: category.id })
        .from(category)
        .where(eq(category.userId, userId))
        .orderBy(asc(category.id))
    ).map(({ id: categoryId }) => categoryId)
    const snapshotIds = (
      await database
        .select({ id: budgetCategory.categoryId })
        .from(budgetCategory)
        .where(eq(budgetCategory.budgetId, createdBudget.id))
        .orderBy(asc(budgetCategory.categoryId))
    ).map(({ id: categoryId }) => categoryId)

    expect([existingIds.toSorted(), allCategoryIds]).toContainEqual(snapshotIds)
  })

  it('duplicates a Budget atomically once for a contested target', async () => {
    const sourceBudgetId = id('source-budget')
    const categoryId = id('source-category')
    const placementId = id('source-placement')
    await database.insert(category).values({
      id: categoryId,
      userId,
      name: 'Source category',
      type: 'expense',
    })
    await database.insert(budget).values({
      id: sourceBudgetId,
      userId,
      name: 'Source',
      type: 'scenario',
    })
    await database.insert(budgetCategory).values({
      id: placementId,
      budgetId: sourceBudgetId,
      categoryId,
    })
    await database.insert(transaction).values({
      id: id('source-transaction'),
      budgetCategoryId: placementId,
      name: 'Rent',
      amount: '100.00',
    })
    const command = () =>
      duplicateBudget(sourceBudgetId, userId, {
        type: BudgetType.Scenario,
        name: 'Copy',
      })

    const results = await Promise.allSettled([command(), command()])

    expectOneConflict(results, DuplicateScenarioBudgetError)
    const [copy] = await database
      .select({ id: budget.id })
      .from(budget)
      .where(eq(budget.name, 'Copy'))
    expect(copy).toBeDefined()
    const copiedTransactions = await database
      .select({ id: transaction.id })
      .from(transaction)
      .innerJoin(
        budgetCategory,
        eq(transaction.budgetCategoryId, budgetCategory.id),
      )
      .where(eq(budgetCategory.budgetId, copy?.id ?? ''))
    expect(copiedTransactions).toHaveLength(1)
  })

  it('serializes simultaneous BudgetCategory reorders', async () => {
    const budgetId = id('reorder-budget')
    const categoryIds = [id('category-a'), id('category-b'), id('category-c')]
    const placementIds = [
      id('placement-a'),
      id('placement-b'),
      id('placement-c'),
    ]
    await database.insert(budget).values({
      id: budgetId,
      userId,
      name: 'Reorder',
      type: 'scenario',
    })
    await database.insert(category).values(
      categoryIds.map((categoryId, index) => ({
        id: categoryId,
        userId,
        name: `Category ${index}`,
        type: 'expense' as const,
      })),
    )
    await database.insert(budgetCategory).values(
      placementIds.map((placementId, index) => ({
        id: placementId,
        budgetId,
        categoryId: categoryIds[index],
        sortOrder: index,
      })),
    )
    const first = placementIds.map((placementId, index) => ({
      id: placementId,
      sortOrder: placementIds.length - index - 1,
    }))
    const second = [placementIds[1], placementIds[2], placementIds[0]].map(
      (placementId, sortOrder) => ({ id: placementId, sortOrder }),
    )

    await Promise.all([
      reorderBudgetCategories(budgetId, userId, first),
      reorderBudgetCategories(budgetId, userId, second),
    ])
    const rows = await database
      .select({ id: budgetCategory.id, sortOrder: budgetCategory.sortOrder })
      .from(budgetCategory)
      .where(inArray(budgetCategory.id, placementIds))
      .orderBy(asc(budgetCategory.sortOrder))

    expect(rows.map(({ sortOrder }) => sortOrder)).toEqual([0, 1, 2])
    expect([
      first.toSorted((a, b) => a.sortOrder - b.sortOrder).map(({ id }) => id),
      second.map(({ id }) => id),
    ]).toContainEqual(rows.map(({ id: placementId }) => placementId))
  })
})
