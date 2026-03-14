import type { CategoryColor } from '$lib/features/categories/colors'
import * as m from '$lib/paraglide/messages'
import { db } from '$lib/server/db'
import { ensureDefined } from 'narrowland'
import {
  findCategoriesByUser,
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
  return findCategoriesByUser(userId)
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
