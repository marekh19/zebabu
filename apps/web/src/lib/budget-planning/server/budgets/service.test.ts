import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findBudgetById: vi.fn(),
  findCategoriesNotInBudget: vi.fn(),
  findOwnedBudgetCategory: vi.fn(),
  insertTransactionAtEnd: vi.fn(),
  listBudgetsByUser: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('$lib/server/persistence/database', () => ({
  database: { transaction: mocks.transaction },
}))

vi.mock('$lib/budget-planning/server/persistence/category-repository', () => ({
  findCategoriesNotInBudget: mocks.findCategoriesNotInBudget,
  findCategoriesByUserTx: vi.fn(),
  findCategoryById: vi.fn(),
}))

vi.mock('../persistence/budget-repository', () => ({
  deleteBudgetById: vi.fn(),
  findBudgetById: mocks.findBudgetById,
  findBudgetOwner: vi.fn(),
  findMonthlyBudget: vi.fn(),
  findOwnedBudgetCategory: mocks.findOwnedBudgetCategory,
  findScenarioBudget: vi.fn(),
  insertBudget: vi.fn(),
  insertBudgetCategories: vi.fn(),
  insertTransactionAtEnd: mocks.insertTransactionAtEnd,
  insertTransactions: vi.fn(),
  listBudgetsByUser: mocks.listBudgetsByUser,
  updateBudgetCategorySortOrders: vi.fn(),
}))

import { createTransaction, getBudgetDetail, listBudgets } from './service'

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

describe('Budget Planning read models', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists only the fields used by Budget Planning callers', async () => {
    const createdAt = new Date('2026-08-29T00:00:00Z')
    mocks.listBudgetsByUser.mockResolvedValue([
      {
        id: 'budget-1',
        userId: 'user-1',
        type: 'monthly',
        name: null,
        month: 8,
        year: 2026,
        createdAt,
        updatedAt: createdAt,
      },
    ])

    await expect(listBudgets('user-1')).resolves.toEqual([
      {
        id: 'budget-1',
        type: 'monthly',
        name: null,
        month: 8,
        year: 2026,
        createdAt,
      },
    ])
  })

  it('loads an owned budget and its available categories as one workspace', async () => {
    mocks.findBudgetById.mockResolvedValue({
      id: 'budget-1',
      userId: 'user-1',
      type: 'scenario',
      name: 'New job',
      month: null,
      year: null,
      budgetCategories: [
        {
          id: 'placement-1',
          category: {
            id: 'category-1',
            name: 'Salary',
            type: 'income',
            color: 'emerald',
          },
          transactions: [
            {
              id: 'transaction-1',
              name: 'Offer',
              note: null,
              amount: '1000.00',
              isPaid: false,
            },
          ],
        },
      ],
    })
    mocks.findCategoriesNotInBudget.mockResolvedValue([
      {
        id: 'category-2',
        name: 'Rent',
        type: 'expense',
        color: 'rose',
      },
    ])

    await expect(getBudgetDetail('budget-1', 'user-1')).resolves.toEqual({
      budget: {
        id: 'budget-1',
        type: 'scenario',
        name: 'New job',
        month: null,
        year: null,
        budgetCategories: [
          {
            id: 'placement-1',
            category: {
              id: 'category-1',
              name: 'Salary',
              type: 'income',
              color: 'emerald',
            },
            transactions: [
              {
                id: 'transaction-1',
                name: 'Offer',
                note: null,
                amount: '1000.00',
                isPaid: false,
              },
            ],
          },
        ],
      },
      availableCategories: [{ id: 'category-2', name: 'Rent' }],
    })
  })
})
