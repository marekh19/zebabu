import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findOwnedBudgetCategory: vi.fn(),
  insertTransactionAtEnd: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('$lib/server/db', () => ({
  db: { transaction: mocks.transaction },
}))

vi.mock('$lib/server/categories/repository', () => ({
  findCategoriesByUserTx: vi.fn(),
  findCategoryById: vi.fn(),
}))

vi.mock('./repository', () => ({
  deleteBudgetById: vi.fn(),
  findBudgetById: vi.fn(),
  findBudgetOwner: vi.fn(),
  findMonthlyBudget: vi.fn(),
  findOwnedBudgetCategory: mocks.findOwnedBudgetCategory,
  findScenarioBudget: vi.fn(),
  insertBudget: vi.fn(),
  insertBudgetCategories: vi.fn(),
  insertTransactionAtEnd: mocks.insertTransactionAtEnd,
  insertTransactions: vi.fn(),
  listBudgetsByUser: vi.fn(),
  updateBudgetCategorySortOrders: vi.fn(),
}))

import { createTransaction } from './service'

describe('createTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(
      (callback: (transaction: object) => unknown) => callback({}),
    )
  })

  it("rejects another user's budget category before insertion", async () => {
    mocks.findOwnedBudgetCategory.mockResolvedValue(undefined)

    const result = await createTransaction(
      'budget-1',
      'user-1',
      'budget-category-1',
      { name: 'Rent', amount: 1000, isPaid: false },
    )

    expect(result).toEqual({ error: 'not_found' })
    expect(mocks.insertTransactionAtEnd).not.toHaveBeenCalled()
  })
})
