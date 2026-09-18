import {
  CategoryType,
  type CategoryColor,
} from '$lib/budget-planning/categories/types'
import { database as db } from '$lib/server/persistence/database'
import { ensureDefined } from 'narrowland'
import {
  areDefaultAllocationTargetsEnabled,
  isCompleteAllocationTargetSet,
  type AllocationTargetsInput,
} from '../../allocation-targets/rules'
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
  insertCategoryTx,
  lockUserCategorySetTx,
  updateCategoryDefaultAllocationTargetsTx,
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

export async function createCategory(
  userId: string,
  data: { name: string; type: 'income' | 'expense'; color: CategoryColor },
) {
  return db.transaction(async (tx) => {
    await lockUserCategorySetTx(tx, userId)
    const existing = await findCategoryByName(tx, userId, data.name)
    if (existing) throw new DuplicateCategoryError()

    const categories = await findCategoriesByUserTx(tx, userId)
    const expenseCategories = categories.filter(
      ({ type }) => type === CategoryType.Expense,
    )
    const defaultsEnabled =
      areDefaultAllocationTargetsEnabled(expenseCategories)
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
    value: ensureDefined(defaultAllocationTarget),
  }))
}

export async function deleteCategory(categoryId: string, userId: string) {
  return db.transaction(async (tx) => {
    await lockUserCategorySetTx(tx, userId)
    const cat = await findCategoryByIdTx(tx, categoryId, userId)
    if (!cat) throw new CategoryNotFoundError()

    if (Number(cat.defaultAllocationTarget) !== 0) {
      throw new NonZeroAllocationTargetError()
    }

    const typeCount = await countCategoriesByTypeTx(tx, userId, cat.type)
    if (typeCount <= 1) throw new LastCategoryOfTypeError()

    const inUse = await findBudgetCategoryByCategoryIdTx(tx, categoryId, userId)
    if (inUse) throw new CategoryInUseError()

    await deleteCategoryTx(tx, categoryId, userId)
  })
}

export async function saveDefaultAllocationTargets(
  userId: string,
  data: AllocationTargetsInput,
) {
  return db.transaction(async (tx) => {
    await lockUserCategorySetTx(tx, userId)
    const expenseCategories = (await findCategoriesByUserTx(tx, userId)).filter(
      ({ type }) => type === CategoryType.Expense,
    )

    if (!data.enabled) {
      await updateCategoryDefaultAllocationTargetsTx(
        tx,
        userId,
        expenseCategories.map(({ id }) => ({
          categoryId: id,
          defaultAllocationTarget: null,
        })),
      )
      return
    }

    if (
      !isCompleteAllocationTargetSet(
        data.targets,
        expenseCategories.map(({ id }) => id),
      )
    ) {
      throw new InvalidAllocationTargetsError()
    }

    await updateCategoryDefaultAllocationTargetsTx(
      tx,
      userId,
      data.targets.map(({ categoryId, value }) => ({
        categoryId,
        defaultAllocationTarget: value.toFixed(1),
      })),
    )
  })
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  data: { name: string; color: CategoryColor },
) {
  return db.transaction(async (tx) => {
    await lockUserCategorySetTx(tx, userId)
    const duplicate = await findCategoryByNameExcluding(
      tx,
      userId,
      data.name,
      categoryId,
    )
    if (duplicate) throw new DuplicateCategoryError()

    const [updated] = await updateCategoryTx(tx, categoryId, userId, data)
    if (!updated) throw new CategoryNotFoundError()
    ensureDefined(updated)
  })
}
