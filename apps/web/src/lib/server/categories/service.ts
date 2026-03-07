import * as m from '$lib/paraglide/messages'
import { insertCategories } from './repository'

export function seedDefaultCategories(userId: string) {
  return insertCategories([
    { userId, name: m.category_default_income(), type: 'income' },
    { userId, name: m.category_default_expense(), type: 'expense' },
  ])
}
