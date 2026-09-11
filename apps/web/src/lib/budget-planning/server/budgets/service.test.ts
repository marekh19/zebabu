import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteTransactionById: vi.fn(),
  findBudgetById: vi.fn(),
  findBudgetOwner: vi.fn(),
  findBudgetWithCategoriesTx: vi.fn(),
  findCategoriesByUserTx: vi.fn(),
  findCategoriesNotInBudget: vi.fn(),
  findCategoryById: vi.fn(),
  findMonthlyBudget: vi.fn(),
  findOwnedBudgetCategory: vi.fn(),
  findOwnedTransaction: vi.fn(),
  findScenarioBudget: vi.fn(),
  insertBudget: vi.fn(),
  insertBudgetCategories: vi.fn(),
  insertTransactions: vi.fn(),
  insertTransactionAtEnd: vi.fn(),
  listTransactionIds: vi.fn(),
  listBudgetsByUser: vi.fn(),
  lockBudgetTransactions: vi.fn(),
  transaction: vi.fn(),
  updateTransactionById: vi.fn(),
  updateTransactionPaidById: vi.fn(),
  updateTransactionPositions: vi.fn(),
  updateBudgetCategoryAllocationTargetTx: vi.fn(),
}))

vi.mock('$lib/server/persistence/database', () => ({
  database: { transaction: mocks.transaction },
}))

vi.mock('$lib/budget-planning/server/persistence/category-repository', () => ({
  findCategoriesNotInBudget: mocks.findCategoriesNotInBudget,
  findCategoriesByUserTx: mocks.findCategoriesByUserTx,
  findCategoryById: mocks.findCategoryById,
}))

vi.mock('../persistence/budget-repository', () => ({
  deleteTransactionById: mocks.deleteTransactionById,
  deleteBudgetById: vi.fn(),
  findBudgetById: mocks.findBudgetById,
  findBudgetOwner: mocks.findBudgetOwner,
  findBudgetWithCategoriesTx: mocks.findBudgetWithCategoriesTx,
  findMonthlyBudget: mocks.findMonthlyBudget,
  findOwnedBudgetCategory: mocks.findOwnedBudgetCategory,
  findOwnedTransaction: mocks.findOwnedTransaction,
  findScenarioBudget: mocks.findScenarioBudget,
  insertBudget: mocks.insertBudget,
  insertBudgetCategories: mocks.insertBudgetCategories,
  insertTransactionAtEnd: mocks.insertTransactionAtEnd,
  insertTransactions: mocks.insertTransactions,
  listTransactionIds: mocks.listTransactionIds,
  listBudgetsByUser: mocks.listBudgetsByUser,
  lockBudgetTransactions: mocks.lockBudgetTransactions,
  updateBudgetCategorySortOrders: vi.fn(),
  updateBudgetCategoryAllocationTargetTx:
    mocks.updateBudgetCategoryAllocationTargetTx,
  updateTransactionById: mocks.updateTransactionById,
  updateTransactionPaidById: mocks.updateTransactionPaidById,
  updateTransactionPositions: mocks.updateTransactionPositions,
}))

import {
  addBudgetCategory,
  createMonthlyBudget,
  createScenarioBudget,
  createTransaction,
  deleteTransaction,
  duplicateBudget,
  getBudgetDetail,
  InvalidBudgetAllocationTargetsError,
  listBudgets,
  positionTransaction,
  saveBudgetAllocationTargets,
  updateTransaction,
  updateTransactionPaid,
} from './service'

const persistedCategory = (
  id: string,
  type: 'income' | 'expense',
  defaultAllocationTarget: string | null,
) => ({ id, type, defaultAllocationTarget })

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

describe('Budget allocation target lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(
      (callback: (transaction: object) => unknown) =>
        callback({ id: 'transaction' }),
    )
    mocks.findMonthlyBudget.mockResolvedValue(undefined)
    mocks.findScenarioBudget.mockResolvedValue(undefined)
    mocks.insertBudget.mockResolvedValue([{ id: 'new-budget' }])
    mocks.insertBudgetCategories.mockResolvedValue([])
  })

  it('copies complete defaults when creating a monthly Budget', async () => {
    mocks.findCategoriesByUserTx.mockResolvedValue([
      persistedCategory('income', 'income', null),
      persistedCategory('rent', 'expense', '60.0'),
      persistedCategory('food', 'expense', '40.0'),
    ])

    await createMonthlyBudget('user-1', {
      month: 9,
      year: 2026,
      useDefaultAllocationTargets: true,
    })

    expect(mocks.insertBudgetCategories).toHaveBeenCalledWith(
      { id: 'transaction' },
      [
        {
          budgetId: 'new-budget',
          categoryId: 'income',
          sortOrder: 0,
          allocationTarget: null,
        },
        {
          budgetId: 'new-budget',
          categoryId: 'rent',
          sortOrder: 1,
          allocationTarget: '60.0',
        },
        {
          budgetId: 'new-budget',
          categoryId: 'food',
          sortOrder: 2,
          allocationTarget: '40.0',
        },
      ],
    )
  })

  it.each([
    [false, ['60.0', '40.0']],
    [true, [null, null]],
  ])(
    'creates a scenario Budget without targets when defaults are declined or incomplete',
    async (useDefaultAllocationTargets, defaults) => {
      mocks.findCategoriesByUserTx.mockResolvedValue([
        persistedCategory('rent', 'expense', defaults[0]),
        persistedCategory('food', 'expense', defaults[1]),
      ])

      await createScenarioBudget('user-1', {
        name: 'Move',
        useDefaultAllocationTargets,
      })

      expect(mocks.insertBudgetCategories).toHaveBeenCalledWith(
        { id: 'transaction' },
        expect.arrayContaining([
          expect.objectContaining({ allocationTarget: null }),
          expect.objectContaining({ allocationTarget: null }),
        ]),
      )
    },
  )

  it('duplicates the source targets without reading current defaults', async () => {
    mocks.findBudgetById.mockResolvedValue({
      id: 'source',
      userId: 'user-1',
      budgetCategories: [
        {
          categoryId: 'rent',
          sortOrder: 0,
          allocationTarget: '75.0',
          transactions: [],
        },
        {
          categoryId: 'food',
          sortOrder: 1,
          allocationTarget: '25.0',
          transactions: [],
        },
      ],
    })

    await duplicateBudget('source', 'user-1', {
      type: 'scenario',
      name: 'Copy',
    })

    expect(mocks.findCategoriesByUserTx).not.toHaveBeenCalled()
    expect(mocks.insertBudgetCategories).toHaveBeenCalledWith(
      { id: 'transaction' },
      [
        {
          budgetId: 'new-budget',
          categoryId: 'rent',
          sortOrder: 0,
          allocationTarget: '75.0',
        },
        {
          budgetId: 'new-budget',
          categoryId: 'food',
          sortOrder: 1,
          allocationTarget: '25.0',
        },
      ],
    )
  })

  it.each([
    ['50.0', '0.0'],
    [null, null],
  ])(
    'adds an expense Category with the Budget target state',
    async (existingTarget, expected) => {
      mocks.findBudgetOwner.mockResolvedValue({
        id: 'budget-1',
        userId: 'user-1',
      })
      mocks.findCategoryById.mockResolvedValue({ id: 'food', type: 'expense' })
      mocks.findBudgetById.mockResolvedValue({
        budgetCategories: [
          {
            id: 'rent-placement',
            allocationTarget: existingTarget,
            category: { type: 'expense' },
          },
        ],
      })

      await addBudgetCategory('budget-1', 'user-1', 'food')

      expect(mocks.insertBudgetCategories).toHaveBeenCalledWith(
        { id: 'transaction' },
        [expect.objectContaining({ allocationTarget: expected })],
      )
    },
  )

  it('validates ownership and the complete BudgetCategory set before writing', async () => {
    mocks.findBudgetWithCategoriesTx.mockResolvedValue({
      userId: 'other-user',
      budgetCategories: [],
    })

    await expect(
      saveBudgetAllocationTargets('budget-1', 'user-1', {
        enabled: true,
        targets: [{ categoryId: 'other-placement', value: 100 }],
      }),
    ).resolves.toEqual({ error: 'access_denied' })
    expect(mocks.updateBudgetCategoryAllocationTargetTx).not.toHaveBeenCalled()

    mocks.findBudgetWithCategoriesTx.mockResolvedValue({
      userId: 'user-1',
      budgetCategories: [
        { id: 'rent', category: { type: 'expense' } },
        { id: 'food', category: { type: 'expense' } },
      ],
    })
    await expect(
      saveBudgetAllocationTargets('budget-1', 'user-1', {
        enabled: true,
        targets: [{ categoryId: 'rent', value: 100 }],
      }),
    ).rejects.toBeInstanceOf(InvalidBudgetAllocationTargetsError)
    expect(mocks.updateBudgetCategoryAllocationTargetTx).not.toHaveBeenCalled()
  })

  it.each([
    [-0.1, 100.1],
    [33.33, 66.67],
    [40, 59.9],
    [40, 60.1],
  ])('rejects invalid target values and totals', async (rent, food) => {
    mocks.findBudgetWithCategoriesTx.mockResolvedValue({
      userId: 'user-1',
      budgetCategories: [
        { id: 'rent', category: { type: 'expense' } },
        { id: 'food', category: { type: 'expense' } },
      ],
    })

    await expect(
      saveBudgetAllocationTargets('budget-1', 'user-1', {
        enabled: true,
        targets: [
          { categoryId: 'rent', value: rent },
          { categoryId: 'food', value: food },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidBudgetAllocationTargetsError)
    expect(mocks.updateBudgetCategoryAllocationTargetTx).not.toHaveBeenCalled()
  })

  it('saves and disables the complete Budget target set', async () => {
    mocks.findBudgetWithCategoriesTx.mockResolvedValue({
      userId: 'user-1',
      budgetCategories: [
        { id: 'rent', category: { type: 'expense' } },
        { id: 'food', category: { type: 'expense' } },
      ],
    })

    await saveBudgetAllocationTargets('budget-1', 'user-1', {
      enabled: true,
      targets: [
        { categoryId: 'rent', value: 60 },
        { categoryId: 'food', value: 40 },
      ],
    })
    expect(mocks.updateBudgetCategoryAllocationTargetTx.mock.calls).toEqual([
      [{ id: 'transaction' }, 'rent', '60.0'],
      [{ id: 'transaction' }, 'food', '40.0'],
    ])

    mocks.updateBudgetCategoryAllocationTargetTx.mockClear()
    await saveBudgetAllocationTargets('budget-1', 'user-1', {
      enabled: false,
      targets: [],
    })
    expect(mocks.updateBudgetCategoryAllocationTargetTx.mock.calls).toEqual([
      [{ id: 'transaction' }, 'rent', null],
      [{ id: 'transaction' }, 'food', null],
    ])
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
