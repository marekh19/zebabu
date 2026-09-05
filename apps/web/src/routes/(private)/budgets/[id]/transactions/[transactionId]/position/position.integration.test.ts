import {
  testDatabase as database,
  testConnection,
} from '$lib/server/persistence/database.test-helper'
import {
  budget,
  budgetCategory,
  category,
  transaction,
  user,
} from '$lib/server/persistence/schema'
import { asc, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { patchTransactionPosition } from './position-handler'

vi.mock('$lib/server/persistence/database', async () => {
  const { testDatabase } =
    await import('$lib/server/persistence/database.test-helper')
  return { database: testDatabase }
})

const testRunId = crypto.randomUUID()
const testId = (name: string) => `position-test-${testRunId}-${name}`
const ids = {
  owner: testId('owner'),
  otherUser: testId('other-user'),
  budget: testId('budget'),
  otherBudget: testId('other-budget'),
  otherUserBudget: testId('other-user-budget'),
  sourceCategory: testId('source-category'),
  targetCategory: testId('target-category'),
  otherUserCategory: testId('other-user-category'),
  source: testId('source'),
  target: testId('target'),
  otherBudgetCategory: testId('other-budget-category'),
  otherUserBudgetCategory: testId('other-user-budget-category'),
  first: testId('first'),
  moved: testId('moved'),
  targetItem: testId('target-item'),
  otherBudgetItem: testId('other-budget-item'),
  otherUserItem: testId('other-user-item'),
} as const

async function cleanUp() {
  await database
    .delete(user)
    .where(inArray(user.id, [ids.owner, ids.otherUser]))
}

async function seed() {
  await database.insert(user).values([
    { id: ids.owner, name: 'Owner', email: `${ids.owner}@example.com` },
    {
      id: ids.otherUser,
      name: 'Other user',
      email: `${ids.otherUser}@example.com`,
    },
  ])
  await database.insert(budget).values([
    { id: ids.budget, userId: ids.owner, name: 'Budget', type: 'scenario' },
    {
      id: ids.otherBudget,
      userId: ids.owner,
      name: 'Other budget',
      type: 'scenario',
    },
    {
      id: ids.otherUserBudget,
      userId: ids.otherUser,
      name: 'Other user budget',
      type: 'scenario',
    },
  ])
  await database.insert(category).values([
    {
      id: ids.sourceCategory,
      userId: ids.owner,
      name: 'Source',
      type: 'expense',
    },
    {
      id: ids.targetCategory,
      userId: ids.owner,
      name: 'Target',
      type: 'income',
    },
    {
      id: ids.otherUserCategory,
      userId: ids.otherUser,
      name: 'Other user',
      type: 'expense',
    },
  ])
  await database.insert(budgetCategory).values([
    {
      id: ids.source,
      budgetId: ids.budget,
      categoryId: ids.sourceCategory,
    },
    {
      id: ids.target,
      budgetId: ids.budget,
      categoryId: ids.targetCategory,
    },
    {
      id: ids.otherBudgetCategory,
      budgetId: ids.otherBudget,
      categoryId: ids.sourceCategory,
    },
    {
      id: ids.otherUserBudgetCategory,
      budgetId: ids.otherUserBudget,
      categoryId: ids.otherUserCategory,
    },
  ])
  await database.insert(transaction).values([
    {
      id: ids.first,
      budgetCategoryId: ids.source,
      name: 'First',
      amount: '10.00',
      sortOrder: 2,
    },
    {
      id: ids.moved,
      budgetCategoryId: ids.source,
      name: 'Moved',
      note: 'Keep this',
      amount: '20.00',
      isPaid: true,
      sortOrder: 7,
    },
    {
      id: ids.targetItem,
      budgetCategoryId: ids.target,
      name: 'Target item',
      amount: '30.00',
      sortOrder: 4,
    },
    {
      id: ids.otherBudgetItem,
      budgetCategoryId: ids.otherBudgetCategory,
      name: 'Other budget item',
      amount: '40.00',
    },
    {
      id: ids.otherUserItem,
      budgetCategoryId: ids.otherUserBudgetCategory,
      name: 'Other user item',
      amount: '50.00',
    },
  ])
}

function patch(
  body: string,
  transactionId: string = ids.moved,
  budgetId: string = ids.budget,
  userId: string = ids.owner,
) {
  return patchTransactionPosition({
    budgetId,
    transactionId,
    userId,
    request: new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
  })
}

function readTransactions() {
  return database
    .select({
      id: transaction.id,
      budgetCategoryId: transaction.budgetCategoryId,
      name: transaction.name,
      note: transaction.note,
      amount: transaction.amount,
      isPaid: transaction.isPaid,
      sortOrder: transaction.sortOrder,
    })
    .from(transaction)
    .where(inArray(transaction.budgetCategoryId, [ids.source, ids.target]))
    .orderBy(asc(transaction.budgetCategoryId), asc(transaction.sortOrder))
}

describe('PATCH transaction position', () => {
  beforeEach(async () => {
    await cleanUp()
    await seed()
  })

  afterAll(async () => {
    await cleanUp()
    await testConnection.end()
  })

  it('moves across category types and atomically normalizes both categories', async () => {
    const response = await patch(
      JSON.stringify({ targetBudgetCategoryId: ids.target, targetIndex: 0 }),
    )

    expect(response.status).toBe(200)
    await expect(readTransactions()).resolves.toEqual([
      {
        id: ids.first,
        budgetCategoryId: ids.source,
        name: 'First',
        note: null,
        amount: '10.00',
        isPaid: false,
        sortOrder: 0,
      },
      {
        id: ids.moved,
        budgetCategoryId: ids.target,
        name: 'Moved',
        note: 'Keep this',
        amount: '20.00',
        isPaid: true,
        sortOrder: 0,
      },
      {
        id: ids.targetItem,
        budgetCategoryId: ids.target,
        name: 'Target item',
        note: null,
        amount: '30.00',
        isPaid: false,
        sortOrder: 1,
      },
    ])
  })

  it('reorders within a category', async () => {
    const response = await patch(
      JSON.stringify({ targetBudgetCategoryId: ids.source, targetIndex: 0 }),
    )

    expect(response.status).toBe(200)
    const rows = await database
      .select({ id: transaction.id, sortOrder: transaction.sortOrder })
      .from(transaction)
      .where(eq(transaction.budgetCategoryId, ids.source))
      .orderBy(asc(transaction.sortOrder))
    expect(rows).toEqual([
      { id: ids.moved, sortOrder: 0 },
      { id: ids.first, sortOrder: 1 },
    ])
  })

  it.each([
    '{}',
    '{"targetBudgetCategoryId":"","targetIndex":0}',
    '{"targetBudgetCategoryId":"target","targetIndex":-1}',
    'invalid json',
  ])('rejects malformed input: %s', async (body) => {
    expect((await patch(body)).status).toBe(400)
  })

  it('rejects an out-of-range target index', async () => {
    const response = await patch(
      JSON.stringify({ targetBudgetCategoryId: ids.target, targetIndex: 2 }),
    )
    expect(response.status).toBe(400)
  })

  it.each([
    ['missing transaction', testId('missing'), ids.budget, ids.owner],
    ['another owned budget', ids.otherBudgetItem, ids.budget, ids.owner],
    ['another user', ids.otherUserItem, ids.otherUserBudget, ids.owner],
  ])(
    'returns one not-found response for %s',
    async (_, itemId, budgetId, userId) => {
      const response = await patch(
        JSON.stringify({ targetBudgetCategoryId: ids.target, targetIndex: 0 }),
        itemId,
        budgetId,
        userId,
      )
      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({
        error: 'Transaction not found',
      })
    },
  )

  it('rejects a target category outside the route budget', async () => {
    const response = await patch(
      JSON.stringify({
        targetBudgetCategoryId: ids.otherBudgetCategory,
        targetIndex: 0,
      }),
    )
    expect(response.status).toBe(404)
  })
})
