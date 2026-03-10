import * as m from '$lib/paraglide/messages'
import { db } from '$lib/server/db'
import { ensureDefined } from 'narrowland'
import {
  findCategoriesByUser,
  findCategoryByName,
  insertCategories,
  insertCategoryTx,
} from './repository'

export class DuplicateCategoryError extends Error {
  constructor() {
    super('A category with this name already exists')
    this.name = 'DuplicateCategoryError'
  }
}

export function seedDefaultCategories(userId: string) {
  return insertCategories([
    { userId, name: m.category_default_income(), type: 'income' },
    { userId, name: m.category_default_expense(), type: 'expense' },
  ])
}

export async function createCategory(
  userId: string,
  data: { name: string; type: 'income' | 'expense' },
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
