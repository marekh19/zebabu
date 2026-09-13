import {
  budget,
  budgetCategory,
  category,
  user,
} from '$lib/server/persistence/schema'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

describe('application persistence schema', () => {
  it.each([
    ['budget', budget],
    ['category', category],
  ])('%s belongs to a user with cascading deletion', (_, table) => {
    const userForeignKey = getTableConfig(table).foreignKeys.find(
      ({ reference }) => reference().foreignColumns[0] === user.id,
    )

    expect(userForeignKey?.reference().foreignColumns).toEqual([user.id])
    expect(userForeignKey?.onDelete).toBe('cascade')
  })

  it('stores nullable Category default allocation targets at one-decimal precision', () => {
    expect(category.defaultAllocationTarget.notNull).toBe(false)
    expect(category.defaultAllocationTarget.getSQLType()).toBe('numeric(4, 1)')
  })

  it('stores nullable BudgetCategory allocation targets at one-decimal precision', () => {
    expect(budgetCategory.allocationTarget.notNull).toBe(false)
    expect(budgetCategory.allocationTarget.getSQLType()).toBe('numeric(4, 1)')
  })
})
