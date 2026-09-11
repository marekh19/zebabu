import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  countCategoriesByTypeTx: vi.fn(),
  deleteCategoryTx: vi.fn(),
  findBudgetCategoryByCategoryIdTx: vi.fn(),
  findCategoriesByUserTx: vi.fn(),
  findCategoriesWithBudgetUsageByUser: vi.fn(),
  findCategoryByIdTx: vi.fn(),
  findCategoryByName: vi.fn(),
  findCategoryByNameExcluding: vi.fn(),
  insertCategories: vi.fn(),
  insertCategoryTx: vi.fn(),
  updateCategoryDefaultAllocationTargetTx: vi.fn(),
  updateCategoryTx: vi.fn(),
}))

vi.mock('$lib/server/persistence/database', () => ({
  database: {
    transaction: vi.fn((operation) => operation({ id: 'transaction' })),
  },
}))

vi.mock('../persistence/category-repository', () => mocks)

import {
  createCategory,
  deleteCategory,
  InvalidAllocationTargetsError,
  NonZeroAllocationTargetError,
  saveDefaultAllocationTargets,
} from './service'

const expense = (id: string, defaultAllocationTarget: string | null) => ({
  id,
  type: 'expense' as const,
  defaultAllocationTarget,
})

describe('category allocation target service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findCategoryByName.mockResolvedValue(undefined)
    mocks.insertCategoryTx.mockResolvedValue([{ id: 'created' }])
  })

  it.each([
    [[expense('one', '100.0')], '0.0'],
    [[expense('one', null)], null],
  ])(
    'creates an expense category with the enabled default state',
    async (categories, expected) => {
      mocks.findCategoriesByUserTx.mockResolvedValue(categories)

      await createCategory('user-1', {
        name: 'Rent',
        type: 'expense',
        color: 'rose',
      })

      expect(mocks.insertCategoryTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ defaultAllocationTarget: expected }),
      )
    },
  )

  it('saves every owned expense target atomically', async () => {
    mocks.findCategoriesByUserTx.mockResolvedValue([
      expense('rent', null),
      expense('food', null),
      { id: 'salary', type: 'income', defaultAllocationTarget: null },
    ])

    await saveDefaultAllocationTargets('user-1', {
      enabled: true,
      targets: [
        { categoryId: 'rent', value: 60 },
        { categoryId: 'food', value: 40 },
      ],
    })

    expect(mocks.updateCategoryDefaultAllocationTargetTx.mock.calls).toEqual([
      [{ id: 'transaction' }, 'rent', '60.0'],
      [{ id: 'transaction' }, 'food', '40.0'],
    ])
  })

  it('rejects incomplete and unowned target sets before writing', async () => {
    mocks.findCategoriesByUserTx.mockResolvedValue([
      expense('rent', null),
      expense('food', null),
    ])

    await expect(
      saveDefaultAllocationTargets('user-1', {
        enabled: true,
        targets: [
          { categoryId: 'rent', value: 50 },
          { categoryId: 'other-user', value: 50 },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidAllocationTargetsError)
    expect(mocks.updateCategoryDefaultAllocationTargetTx).not.toHaveBeenCalled()
  })

  it('clears the complete target set when disabled', async () => {
    mocks.findCategoriesByUserTx.mockResolvedValue([
      expense('rent', '60.0'),
      expense('food', '40.0'),
    ])

    await saveDefaultAllocationTargets('user-1', {
      enabled: false,
      targets: [],
    })

    expect(mocks.updateCategoryDefaultAllocationTargetTx.mock.calls).toEqual([
      [{ id: 'transaction' }, 'rent', null],
      [{ id: 'transaction' }, 'food', null],
    ])
  })

  it('blocks deletion of a non-zero target before deleting', async () => {
    mocks.findCategoryByIdTx.mockResolvedValue(expense('rent', '100.0'))

    await expect(deleteCategory('rent', 'user-1')).rejects.toBeInstanceOf(
      NonZeroAllocationTargetError,
    )
    expect(mocks.deleteCategoryTx).not.toHaveBeenCalled()
  })
})
