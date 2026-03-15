import type { CategoryColor } from '$lib/features/categories/colors'
import * as m from '$lib/paraglide/messages'
import { db } from '$lib/server/db'
import { ensureDefined } from 'narrowland'
import {
  countCategoriesByTypeTx,
  deleteCategoryTx,
  findBudgetCategoryByCategoryIdTx,
  findCategoriesWithBudgetUsageByUser,
  findCategoryByIdTx,
  findCategoryByName,
  findCategoryByNameExcluding,
  insertCategories,
  insertCategoryTx,
  updateCategoryTx,
} from './repository'

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

export function seedDefaultCategories(userId: string) {
  return insertCategories([
    {
      userId,
      name: m.category_default_income(),
      type: 'income',
      color: 'emerald',
    },
    {
      userId,
      name: m.category_default_expense(),
      type: 'expense',
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

    const [inserted] = await insertCategoryTx(tx, { userId, ...data })
    return ensureDefined(inserted)
  })
}

export function listCategories(userId: string) {
  return findCategoriesWithBudgetUsageByUser(userId)
}

export async function deleteCategory(categoryId: string, userId: string) {
  return db.transaction(async (tx) => {
    const cat = await findCategoryByIdTx(tx, categoryId, userId)
    if (!cat) throw new CategoryNotFoundError()

    const typeCount = await countCategoriesByTypeTx(tx, userId, cat.type)
    if (typeCount <= 1) throw new LastCategoryOfTypeError()

    const inUse = await findBudgetCategoryByCategoryIdTx(tx, categoryId)
    if (inUse) throw new CategoryInUseError()

    await deleteCategoryTx(tx, categoryId)
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
    return ensureDefined(updated)
  })
}
