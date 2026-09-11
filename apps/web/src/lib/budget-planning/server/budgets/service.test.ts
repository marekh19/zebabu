import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteTransactionById: vi.fn(),
  findBudgetById: vi.fn(),
  findCategoriesNotInBudget: vi.fn(),
  findOwnedBudgetCategory: vi.fn(),
  findOwnedTransaction: vi.fn(),
  insertTransactionAtEnd: vi.fn(),
  listTransactionIds: vi.fn(),
  listBudgetsByUser: vi.fn(),
  lockBudgetTransactions: vi.fn(),
  transaction: vi.fn(),
  updateTransactionById: vi.fn(),
  updateTransactionPaidById: vi.fn(),
  updateTransactionPositions: vi.fn(),
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
  deleteTransactionById: mocks.deleteTransactionById,
  deleteBudgetById: vi.fn(),
  findBudgetById: mocks.findBudgetById,
  findBudgetOwner: vi.fn(),
  findMonthlyBudget: vi.fn(),
  findOwnedBudgetCategory: mocks.findOwnedBudgetCategory,
  findOwnedTransaction: mocks.findOwnedTransaction,
  findScenarioBudget: vi.fn(),
  insertBudget: vi.fn(),
  insertBudgetCategories: vi.fn(),
  insertTransactionAtEnd: mocks.insertTransactionAtEnd,
  insertTransactions: vi.fn(),
  listTransactionIds: mocks.listTransactionIds,
  listBudgetsByUser: mocks.listBudgetsByUser,
  lockBudgetTransactions: mocks.lockBudgetTransactions,
  updateBudgetCategorySortOrders: vi.fn(),
  updateTransactionById: mocks.updateTransactionById,
  updateTransactionPaidById: mocks.updateTransactionPaidById,
  updateTransactionPositions: mocks.updateTransactionPositions,
}))

import {
  createTransaction,
  deleteTransaction,
  getBudgetDetail,
  listBudgets,
  positionTransaction,
  updateTransaction,
  updateTransactionPaid,
} from './service'

describe('positionTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(
      (callback: (transaction: object) => unknown) => callback({}),
    )
  })

  it('locks the budget and moves a transaction between normalized categories', async () => {
    mocks.findOwnedTransaction.mockResolvedValue({
      id: 'transaction-2',
      budgetCategoryId: 'source',
      sortOrder: 4,
    })
    mocks.findOwnedBudgetCategory.mockResolvedValue({ id: 'target' })
    mocks.listTransactionIds
      .mockResolvedValueOnce([{ id: 'transaction-1' }, { id: 'transaction-2' }])
      .mockResolvedValueOnce([{ id: 'transaction-3' }])

    await expect(
      positionTransaction({
        budgetId: 'budget-1',
        userId: 'user-1',
        transactionId: 'transaction-2',
        targetBudgetCategoryId: 'target',
        targetIndex: 0,
      }),
    ).resolves.toEqual({})

    expect(mocks.lockBudgetTransactions).toHaveBeenCalledWith({}, 'budget-1')
    expect(mocks.updateTransactionPositions).toHaveBeenCalledWith(
      {},
      'transaction-2',
      'target',
      ['transaction-1'],
      ['transaction-2', 'transaction-3'],
    )
  })

  it('normalizes a same-category reorder', async () => {
    mocks.findOwnedTransaction.mockResolvedValue({
      id: 'transaction-3',
      budgetCategoryId: 'source',
      sortOrder: 8,
    })
    mocks.findOwnedBudgetCategory.mockResolvedValue({ id: 'source' })
    mocks.listTransactionIds.mockResolvedValue([
      { id: 'transaction-1' },
      { id: 'transaction-2' },
      { id: 'transaction-3' },
    ])

    await positionTransaction({
      budgetId: 'budget-1',
      userId: 'user-1',
      transactionId: 'transaction-3',
      targetBudgetCategoryId: 'source',
      targetIndex: 1,
    })

    expect(mocks.updateTransactionPositions).toHaveBeenCalledWith(
      {},
      'transaction-3',
      'source',
      ['transaction-1', 'transaction-3', 'transaction-2'],
      ['transaction-1', 'transaction-3', 'transaction-2'],
    )
    expect(mocks.listTransactionIds).toHaveBeenCalledTimes(1)
  })

  it('rejects missing or out-of-budget records with one error', async () => {
    mocks.findOwnedTransaction.mockResolvedValue(undefined)

    await expect(
      positionTransaction({
        budgetId: 'budget-1',
        userId: 'user-1',
        transactionId: 'missing',
        targetBudgetCategoryId: 'target',
        targetIndex: 0,
      }),
    ).resolves.toEqual({ error: 'not_found' })
    expect(mocks.findOwnedBudgetCategory).not.toHaveBeenCalled()
    expect(mocks.updateTransactionPositions).not.toHaveBeenCalled()
  })

  it('rejects an out-of-range position', async () => {
    mocks.findOwnedTransaction.mockResolvedValue({
      id: 'transaction-1',
      budgetCategoryId: 'source',
      sortOrder: 0,
    })
    mocks.findOwnedBudgetCategory.mockResolvedValue({ id: 'target' })
    mocks.listTransactionIds
      .mockResolvedValueOnce([{ id: 'transaction-1' }])
      .mockResolvedValueOnce([])

    await expect(
      positionTransaction({
        budgetId: 'budget-1',
        userId: 'user-1',
        transactionId: 'transaction-1',
        targetBudgetCategoryId: 'target',
        targetIndex: 1,
      }),
    ).resolves.toEqual({ error: 'invalid_position' })
    expect(mocks.updateTransactionPositions).not.toHaveBeenCalled()
  })
})

describe('deleteTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(
      (callback: (transaction: object) => unknown) => callback({}),
    )
  })

  it('deletes a transaction in the owned route budget', async () => {
    mocks.findOwnedTransaction.mockResolvedValue({ id: 'transaction-1' })

    await expect(
      deleteTransaction('budget-1', 'user-1', 'transaction-1'),
    ).resolves.toEqual({})
    expect(mocks.deleteTransactionById).toHaveBeenCalledWith(
      {},
      'transaction-1',
    )
  })

  it('leaves a transaction outside the owned route budget untouched', async () => {
    mocks.findOwnedTransaction.mockResolvedValue(undefined)

    await expect(
      deleteTransaction('budget-1', 'user-1', 'transaction-1'),
    ).resolves.toEqual({ error: 'not_found' })
    expect(mocks.deleteTransactionById).not.toHaveBeenCalled()
  })
})

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

describe('updateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(
      (callback: (transaction: object) => unknown) => callback({}),
    )
  })

  it('rejects a transaction outside the owned route budget', async () => {
    mocks.findOwnedTransaction.mockResolvedValue(undefined)

    const result = await updateTransaction(
      'budget-1',
      'user-1',
      'transaction-1',
      { name: 'Rent', amount: 1000, isPaid: true, note: '' },
    )

    expect(result).toEqual({ error: 'not_found' })
    expect(mocks.updateTransactionById).not.toHaveBeenCalled()
  })

  it('updates only editable fields', async () => {
    mocks.findOwnedTransaction.mockResolvedValue({
      id: 'transaction-1',
      budgetCategoryId: 'budget-category-1',
      sortOrder: 3,
    })

    await updateTransaction('budget-1', 'user-1', 'transaction-1', {
      name: 'Rent updated',
      amount: 1200.5,
      isPaid: true,
      note: '',
    })

    expect(mocks.updateTransactionById).toHaveBeenCalledWith(
      {},
      'transaction-1',
      {
        name: 'Rent updated',
        amount: '1200.5',
        isPaid: true,
        note: null,
      },
    )
  })
})

describe('updateTransactionPaid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(
      (callback: (transaction: object) => unknown) => callback({}),
    )
  })

  it('rejects a transaction outside the owned route budget', async () => {
    mocks.findOwnedTransaction.mockResolvedValue(undefined)

    await expect(
      updateTransactionPaid('budget-1', 'user-1', 'transaction-1', true),
    ).resolves.toEqual({ error: 'not_found' })
    expect(mocks.updateTransactionPaidById).not.toHaveBeenCalled()
  })

  it('updates only the paid state', async () => {
    mocks.findOwnedTransaction.mockResolvedValue({ id: 'transaction-1' })

    await updateTransactionPaid('budget-1', 'user-1', 'transaction-1', false)

    expect(mocks.updateTransactionPaidById).toHaveBeenCalledWith(
      {},
      'transaction-1',
      false,
    )
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
