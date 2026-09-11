import {
  type CategoryColor,
  CategoryType,
} from '$lib/budget-planning/categories/types'
import * as m from '$lib/paraglide/messages'
import { database as db } from '$lib/server/persistence/database'
import { ensureDefined } from 'narrowland'
import type { AllocationTargetsInput } from '../../allocation-targets/schema'
import { toCategoryListItem } from '../model-mappers'
import {
  countCategoriesByTypeTx,
  deleteCategoryTx,
  findBudgetCategoryByCategoryIdTx,
  findCategoriesByUser,
  findCategoriesByUserTx,
  findCategoriesWithBudgetUsageByUser,
  findCategoryByIdTx,
  findCategoryByName,
  findCategoryByNameExcluding,
  insertCategories,
  insertCategoryTx,
  updateCategoryDefaultAllocationTargetTx,
  updateCategoryTx,
} from '../persistence/category-repository'

export class CategoryNotFoundError extends Error {
  constructor() {
    super('Category not found')
    this.name = 'CategoryNotFoundError'
  }
}

export class LastCategoryOfTypeError extends Error {
  constructor() {
    super('Cannot delete the last category of this type')
    this.name = 'LastCategoryOfTypeError'
  }
}

export class CategoryInUseError extends Error {
  constructor() {
    super('Category is used in one or more budgets')
    this.name = 'CategoryInUseError'
  }
}

export class DuplicateCategoryError extends Error {
  constructor() {
    super('A category with this name already exists')
    this.name = 'DuplicateCategoryError'
  }
}

export class InvalidAllocationTargetsError extends Error {
  constructor() {
    super(
      'Allocation targets must include every expense category and total 100.0%',
    )
    this.name = 'InvalidAllocationTargetsError'
  }
}

export class NonZeroAllocationTargetError extends Error {
  constructor() {
    super('A category with a non-zero allocation target cannot be deleted')
    this.name = 'NonZeroAllocationTargetError'
  }
}

export async function seedDefaultCategories(userId: string): Promise<void> {
  await insertCategories([
    {
      userId,
      name: m.category_default_income(),
      type: CategoryType.Income,
      color: 'emerald',
    },
    {
      userId,
      name: m.category_default_expense(),
      type: CategoryType.Expense,
      color: 'rose',
    },
  ])
}

export async function createCategory(
  userId: string,
  data: { name: string; type: 'income' | 'expense'; color: CategoryColor },
) {
  return db.transaction(async (tx) => {
    const existing = await findCategoryByName(tx, userId, data.name)
    if (existing) throw new DuplicateCategoryError()

    const categories = await findCategoriesByUserTx(tx, userId)
    const expenseCategories = categories.filter(
      ({ type }) => type === CategoryType.Expense,
    )
    const defaultsEnabled =
      expenseCategories.length > 0 &&
      expenseCategories.every(
        ({ defaultAllocationTarget }) => defaultAllocationTarget !== null,
      )
    const defaultAllocationTarget =
      data.type === CategoryType.Expense && defaultsEnabled ? '0.0' : null

    const [inserted] = await insertCategoryTx(tx, {
      userId,
      ...data,
      defaultAllocationTarget,
    })
    ensureDefined(inserted)
  })
}

export function listCategories(userId: string) {
  return findCategoriesWithBudgetUsageByUser(userId).then((categories) =>
    categories.map(toCategoryListItem),
  )
}

export async function getCompleteDefaultAllocationTargets(userId: string) {
  const expenseCategories = (await findCategoriesByUser(userId)).filter(
    ({ type }) => type === CategoryType.Expense,
  )
  if (
    expenseCategories.length === 0 ||
    expenseCategories.some(
      ({ defaultAllocationTarget }) => defaultAllocationTarget === null,
    )
  ) {
    return null
  }

  return expenseCategories.map(({ id, defaultAllocationTarget }) => ({
    categoryId: id,
    value: Number(defaultAllocationTarget),
  }))
}

export async function deleteCategory(categoryId: string, userId: string) {
  return db.transaction(async (tx) => {
    const cat = await findCategoryByIdTx(tx, categoryId, userId)
    if (!cat) throw new CategoryNotFoundError()

    if (Number(cat.defaultAllocationTarget) !== 0) {
      throw new NonZeroAllocationTargetError()
    }

    const typeCount = await countCategoriesByTypeTx(tx, userId, cat.type)
    if (typeCount <= 1) throw new LastCategoryOfTypeError()

    const inUse = await findBudgetCategoryByCategoryIdTx(tx, categoryId)
    if (inUse) throw new CategoryInUseError()

    await deleteCategoryTx(tx, categoryId)
  })
}

export async function saveDefaultAllocationTargets(
  userId: string,
  data: AllocationTargetsInput,
) {
  return db.transaction(async (tx) => {
    const expenseCategories = (await findCategoriesByUserTx(tx, userId)).filter(
      ({ type }) => type === CategoryType.Expense,
    )

    if (!data.enabled) {
      await Promise.all(
        expenseCategories.map(({ id }) =>
          updateCategoryDefaultAllocationTargetTx(tx, id, null),
        ),
      )
      return
    }

    const ownedIds = new Set(expenseCategories.map(({ id }) => id))
    const submittedIds = new Set(
      data.targets.map(({ categoryId }) => categoryId),
    )
    const totalTenths = data.targets.reduce(
      (total, target) => total + Math.round(target.value * 10),
      0,
    )
    const isComplete =
      submittedIds.size === ownedIds.size &&
      data.targets.length === ownedIds.size &&
      data.targets.every(({ categoryId }) => ownedIds.has(categoryId))

    if (!isComplete || totalTenths !== 1000) {
      throw new InvalidAllocationTargetsError()
    }

    await Promise.all(
      data.targets.map(({ categoryId, value }) =>
        updateCategoryDefaultAllocationTargetTx(
          tx,
          categoryId,
          value.toFixed(1),
        ),
      ),
    )
  })
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  data: { name: string; color: CategoryColor },
) {
  return db.transaction(async (tx) => {
    const duplicate = await findCategoryByNameExcluding(
      tx,
      userId,
      data.name,
      categoryId,
    )
    if (duplicate) throw new DuplicateCategoryError()

    const [updated] = await updateCategoryTx(tx, categoryId, data)
    if (!updated) throw new CategoryNotFoundError()
    ensureDefined(updated)
  })
}
