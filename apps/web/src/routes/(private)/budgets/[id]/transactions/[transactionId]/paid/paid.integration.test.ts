import { getBudgetDetail } from '$lib/budget-planning/server'
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
import { inArray } from 'drizzle-orm'
import { ensureDefined } from 'narrowland'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { patchTransactionPaid } from './paid-handler'

vi.mock('$lib/server/persistence/database', async () => {
  const { testDatabase } =
    await import('$lib/server/persistence/database.test-helper')
  return { database: testDatabase }
})

const testRunId = crypto.randomUUID()
const testId = (name: string) => `paid-test-${testRunId}-${name}`
const ids = {
  owner: testId('owner'),
  otherUser: testId('other-user'),
  budget: testId('budget'),
  otherBudget: testId('other-budget'),
  otherUserBudget: testId('other-user-budget'),
  category: testId('category'),
  otherUserCategory: testId('other-user-category'),
  budgetCategory: testId('budget-category'),
  otherBudgetCategory: testId('other-budget-category'),
  otherUserBudgetCategory: testId('other-user-budget-category'),
  companionTransaction: testId('companion-transaction'),
  transaction: testId('transaction'),
  otherBudgetTransaction: testId('other-budget-transaction'),
  otherUserTransaction: testId('other-user-transaction'),
} as const

const testUserIds = [ids.owner, ids.otherUser]

async function cleanUp() {
  await database.delete(user).where(inArray(user.id, testUserIds))
}

async function seed() {
  await database.insert(user).values([
    {
      id: ids.owner,
      name: 'Paid test owner',
      email: `${ids.owner}@example.com`,
    },
    {
      id: ids.otherUser,
      name: 'Paid test other user',
      email: `${ids.otherUser}@example.com`,
    },
  ])
  await database.insert(budget).values([
    { id: ids.budget, userId: ids.owner, name: 'Paid test', type: 'scenario' },
    {
      id: ids.otherBudget,
      userId: ids.owner,
      name: 'Paid test other budget',
      type: 'scenario',
    },
    {
      id: ids.otherUserBudget,
      userId: ids.otherUser,
      name: 'Paid test other user budget',
      type: 'scenario',
    },
  ])
  await database.insert(category).values([
    {
      id: ids.category,
      userId: ids.owner,
      name: 'Paid test category',
      type: 'expense',
    },
    {
      id: ids.otherUserCategory,
      userId: ids.otherUser,
      name: 'Paid test other user category',
      type: 'expense',
    },
  ])
  await database.insert(budgetCategory).values([
    {
      id: ids.budgetCategory,
      budgetId: ids.budget,
      categoryId: ids.category,
    },
    {
      id: ids.otherBudgetCategory,
      budgetId: ids.otherBudget,
      categoryId: ids.category,
    },
    {
      id: ids.otherUserBudgetCategory,
      budgetId: ids.otherUserBudget,
      categoryId: ids.otherUserCategory,
    },
  ])
  await database.insert(transaction).values([
    {
      id: ids.companionTransaction,
      budgetCategoryId: ids.budgetCategory,
      name: 'Earlier transaction',
      amount: '25.00',
      sortOrder: 1,
    },
    {
      id: ids.transaction,
      budgetCategoryId: ids.budgetCategory,
      name: 'Rent',
      note: 'Paid by transfer',
      amount: '1250.50',
      sortOrder: 2,
    },
    {
      id: ids.otherBudgetTransaction,
      budgetCategoryId: ids.otherBudgetCategory,
      name: 'Other budget transaction',
      amount: '50.00',
    },
    {
      id: ids.otherUserTransaction,
      budgetCategoryId: ids.otherUserBudgetCategory,
      name: 'Other user transaction',
      amount: '75.00',
    },
  ])
}

function request(body: string) {
  return new Request('http://localhost', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

function patch(
  body: string,
  budgetId: string = ids.budget,
  transactionId: string = ids.transaction,
  userId: string = ids.owner,
) {
  return patchTransactionPaid({
    budgetId,
    transactionId,
    userId,
    request: request(body),
  })
}

async function readTransaction(
  budgetId: string,
  userId: string,
  transactionId: string,
) {
  const result = await getBudgetDetail(budgetId, userId)
  if (result.error) throw new Error(result.error)

  return ensureDefined(
    result.budget.budgetCategories
      .flatMap((placement) => placement.transactions)
      .find((item) => item.id === transactionId),
  )
}

describe('PATCH transaction paid state', () => {
  beforeEach(async () => {
    await cleanUp()
    await seed()
  })

  afterAll(async () => {
    await cleanUp()
    await testConnection.end()
  })

  it('persists both paid states without changing other transaction data', async () => {
    const paidResponse = await patch('{"isPaid":true}')

    expect(paidResponse.status).toBe(200)
    await expect(
      readTransaction(ids.budget, ids.owner, ids.transaction),
    ).resolves.toEqual({
      id: ids.transaction,
      name: 'Rent',
      note: 'Paid by transfer',
      amount: '1250.5',
      isPaid: true,
    })

    const unpaidResponse = await patch('{"isPaid":false}')

    expect(unpaidResponse.status).toBe(200)
    await expect(
      readTransaction(ids.budget, ids.owner, ids.transaction),
    ).resolves.toEqual({
      id: ids.transaction,
      name: 'Rent',
      note: 'Paid by transfer',
      amount: '1250.5',
      isPaid: false,
    })

    const result = await getBudgetDetail(ids.budget, ids.owner)
    if (result.error) throw new Error(result.error)
    expect(result.budget.budgetCategories).toMatchObject([
      {
        id: ids.budgetCategory,
        transactions: [
          { id: ids.companionTransaction },
          { id: ids.transaction },
        ],
      },
    ])
  })

  it.each(['{}', '{"isPaid":"true"}', 'invalid json'])(
    'rejects malformed input: %s',
    async (body) => {
      const response = await patch(body)

      expect(response.status).toBe(400)
      await expect(
        readTransaction(ids.budget, ids.owner, ids.transaction),
      ).resolves.toMatchObject({ isPaid: false })
    },
  )

  it('rejects a transaction from another budget owned by the user', async () => {
    const response = await patch(
      '{"isPaid":true}',
      ids.budget,
      ids.otherBudgetTransaction,
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Transaction not found',
    })
    await expect(
      readTransaction(ids.otherBudget, ids.owner, ids.otherBudgetTransaction),
    ).resolves.toMatchObject({ isPaid: false })
  })

  it('rejects a transaction owned by another user', async () => {
    const response = await patch(
      '{"isPaid":true}',
      ids.otherUserBudget,
      ids.otherUserTransaction,
      ids.owner,
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Transaction not found',
    })
    await expect(
      readTransaction(
        ids.otherUserBudget,
        ids.otherUser,
        ids.otherUserTransaction,
      ),
    ).resolves.toMatchObject({ isPaid: false })
  })

  it('returns the same response for a missing transaction', async () => {
    const response = await patch(
      '{"isPaid":true}',
      ids.budget,
      testId('missing-transaction'),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Transaction not found',
    })
  })
})
