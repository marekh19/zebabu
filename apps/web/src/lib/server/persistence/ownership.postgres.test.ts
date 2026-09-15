import {
  addBudgetCategory,
  createTransaction,
  deleteBudget,
  deleteTransaction,
  duplicateBudget,
  getBudgetDetail,
  listBudgets,
  positionTransaction,
  reorderBudgetCategories,
  saveBudgetAllocationTargets,
  updateTransaction,
  updateTransactionPaid,
} from '$lib/budget-planning/server/budgets/service'
import {
  deleteCategory,
  listCategories,
  saveDefaultAllocationTargets,
  updateCategory,
} from '$lib/budget-planning/server/categories/service'
import {
  budget,
  budgetCategory,
  category,
  transaction,
  user,
} from '$lib/server/persistence/schema'
import { afterAll, beforeEach, describe, expect, it } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { testDatabase as database } from './database.test-helper'

const runId = crypto.randomUUID()
const id = (name: string) => `ownership-${runId}-${name}`
const ids = {
  owner: id('owner'),
  other: id('other'),
  ownerBudget: id('owner-budget'),
  otherBudget: id('other-budget'),
  ownerIncome: id('owner-income'),
  ownerExpense: id('owner-expense'),
  otherExpense: id('other-expense'),
  ownerPlacement: id('owner-placement'),
  otherPlacement: id('other-placement'),
  ownerTransaction: id('owner-transaction'),
  otherTransaction: id('other-transaction'),
  missing: id('missing'),
} as const

async function cleanUp() {
  await database.delete(user).where(inArray(user.id, [ids.owner, ids.other]))
}

async function seed() {
  await database.insert(user).values([
    { id: ids.owner, name: 'Owner', email: `${ids.owner}@example.com` },
    { id: ids.other, name: 'Other', email: `${ids.other}@example.com` },
  ])
  await database.insert(category).values([
    {
      id: ids.ownerIncome,
      userId: ids.owner,
      name: 'Owner income',
      type: 'income',
    },
    {
      id: ids.ownerExpense,
      userId: ids.owner,
      name: 'Owner expense',
      type: 'expense',
      defaultAllocationTarget: '100.0',
    },
    {
      id: ids.otherExpense,
      userId: ids.other,
      name: 'Other expense',
      type: 'expense',
      defaultAllocationTarget: '100.0',
    },
  ])
  await database.insert(budget).values([
    {
      id: ids.ownerBudget,
      userId: ids.owner,
      name: 'Owner budget',
      type: 'scenario',
    },
    {
      id: ids.otherBudget,
      userId: ids.other,
      name: 'Other budget',
      type: 'scenario',
    },
  ])
  await database.insert(budgetCategory).values([
    {
      id: ids.ownerPlacement,
      budgetId: ids.ownerBudget,
      categoryId: ids.ownerExpense,
      allocationTarget: '100.0',
    },
    {
      id: ids.otherPlacement,
      budgetId: ids.otherBudget,
      categoryId: ids.otherExpense,
      allocationTarget: '100.0',
    },
  ])
  await database.insert(transaction).values([
    {
      id: ids.ownerTransaction,
      budgetCategoryId: ids.ownerPlacement,
      name: 'Owner transaction',
      amount: '10.00',
    },
    {
      id: ids.otherTransaction,
      budgetCategoryId: ids.otherPlacement,
      name: 'Other transaction',
      amount: '20.00',
    },
  ])
}

async function rejectionName(operation: Promise<unknown>) {
  try {
    await operation
    return null
  } catch (error) {
    return error instanceof Error ? error.name : String(error)
  }
}

describe('PostgreSQL ownership boundary', () => {
  beforeEach(async () => {
    await cleanUp()
    await seed()
  })

  afterAll(cleanUp)

  it('lists only the authenticated User resources', async () => {
    expect((await listCategories(ids.owner)).map(({ id }) => id)).toEqual([
      ids.ownerExpense,
      ids.ownerIncome,
    ])
    expect((await listBudgets(ids.owner)).map(({ id }) => id)).toEqual([
      ids.ownerBudget,
    ])
  })

  it('makes missing and foreign Budget detail indistinguishable', async () => {
    await database.insert(budgetCategory).values({
      id: id('cross-user-placement'),
      budgetId: ids.ownerBudget,
      categoryId: ids.otherExpense,
    })

    const owned = await getBudgetDetail(ids.ownerBudget, ids.owner)
    expect(owned.budget?.budgetCategories.map(({ id }) => id)).toEqual([
      ids.ownerPlacement,
    ])
    expect(await getBudgetDetail(ids.otherBudget, ids.owner)).toEqual(
      await getBudgetDetail(ids.missing, ids.owner),
    )
  })

  it('cannot update or delete another User Category', async () => {
    const updateForeign = await rejectionName(
      updateCategory(ids.otherExpense, ids.owner, {
        name: 'Changed',
        color: 'rose',
      }),
    )
    const updateMissing = await rejectionName(
      updateCategory(ids.missing, ids.owner, {
        name: 'Changed',
        color: 'rose',
      }),
    )
    const deleteForeign = await rejectionName(
      deleteCategory(ids.otherExpense, ids.owner),
    )
    const deleteMissing = await rejectionName(
      deleteCategory(ids.missing, ids.owner),
    )

    expect(updateForeign).toBe(updateMissing)
    expect(deleteForeign).toBe(deleteMissing)
    const [other] = await database
      .select({ name: category.name })
      .from(category)
      .where(eq(category.id, ids.otherExpense))
    expect(other?.name).toBe('Other expense')
  })

  it('bulk default targets cannot update another User Category', async () => {
    await saveDefaultAllocationTargets(ids.owner, {
      enabled: false,
      targets: [],
    })

    const [other] = await database
      .select({ target: category.defaultAllocationTarget })
      .from(category)
      .where(eq(category.id, ids.otherExpense))
    expect(other?.target).toBe('100.0')
  })

  it('cannot mutate or duplicate another User Budget', async () => {
    expect(await deleteBudget(ids.otherBudget, ids.owner)).toEqual(
      await deleteBudget(ids.missing, ids.owner),
    )
    expect(
      await duplicateBudget(ids.otherBudget, ids.owner, {
        type: 'scenario',
        name: 'Foreign copy',
      }),
    ).toEqual(
      await duplicateBudget(ids.missing, ids.owner, {
        type: 'scenario',
        name: 'Missing copy',
      }),
    )
    expect(
      await saveBudgetAllocationTargets(ids.otherBudget, ids.owner, {
        enabled: false,
        targets: [],
      }),
    ).toEqual(
      await saveBudgetAllocationTargets(ids.missing, ids.owner, {
        enabled: false,
        targets: [],
      }),
    )
    expect(
      await addBudgetCategory(ids.ownerBudget, ids.owner, ids.otherExpense),
    ).toEqual(await addBudgetCategory(ids.ownerBudget, ids.owner, ids.missing))
  })

  it('cannot use a nested BudgetCategory from another Budget', async () => {
    const data = { name: 'Attempt', amount: 1, isPaid: false }
    expect(
      await createTransaction(
        ids.ownerBudget,
        ids.owner,
        ids.otherPlacement,
        data,
      ),
    ).toEqual(
      await createTransaction(ids.ownerBudget, ids.owner, ids.missing, data),
    )
    expect(
      await positionTransaction({
        budgetId: ids.ownerBudget,
        userId: ids.owner,
        transactionId: ids.ownerTransaction,
        targetBudgetCategoryId: ids.otherPlacement,
        targetIndex: 0,
      }),
    ).toEqual(
      await positionTransaction({
        budgetId: ids.ownerBudget,
        userId: ids.owner,
        transactionId: ids.ownerTransaction,
        targetBudgetCategoryId: ids.missing,
        targetIndex: 0,
      }),
    )
  })

  it('cannot update or delete another User Transaction', async () => {
    const data = { name: 'Changed', amount: 1, isPaid: true }
    expect(
      await updateTransaction(
        ids.otherBudget,
        ids.owner,
        ids.otherTransaction,
        data,
      ),
    ).toEqual(
      await updateTransaction(ids.ownerBudget, ids.owner, ids.missing, data),
    )
    expect(
      await updateTransactionPaid(
        ids.otherBudget,
        ids.owner,
        ids.otherTransaction,
        true,
      ),
    ).toEqual(
      await updateTransactionPaid(
        ids.ownerBudget,
        ids.owner,
        ids.missing,
        true,
      ),
    )
    expect(
      await deleteTransaction(ids.otherBudget, ids.owner, ids.otherTransaction),
    ).toEqual(await deleteTransaction(ids.ownerBudget, ids.owner, ids.missing))
  })

  it('cannot reorder another User Budget', async () => {
    expect(
      await reorderBudgetCategories(ids.otherBudget, ids.owner, [
        { id: ids.otherPlacement, sortOrder: 0 },
      ]),
    ).toEqual(
      await reorderBudgetCategories(ids.missing, ids.owner, [
        { id: ids.missing, sortOrder: 0 },
      ]),
    )
  })
})
