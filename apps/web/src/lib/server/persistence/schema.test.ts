import {
  account,
  budget,
  budgetCategory,
  category,
  transaction,
  user,
} from '$lib/server/persistence/schema'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

describe('application persistence schema', () => {
  it('matches the Better Auth 1.7.2 account contract', () => {
    expect(getTableConfig(account).columns.map(({ name }) => name)).toEqual([
      'id',
      'issuer',
      'account_id',
      'provider_id',
      'user_id',
      'access_token',
      'refresh_token',
      'id_token',
      'access_token_expires_at',
      'refresh_token_expires_at',
      'scope',
      'password',
      'created_at',
      'updated_at',
    ])
  })

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

  it.each([
    [budget, ['budget_shape_check']],
    [category, ['category_default_allocation_target_check']],
    [
      budgetCategory,
      [
        'budget_category_sort_order_check',
        'budget_category_allocation_target_check',
      ],
    ],
    [transaction, ['transaction_amount_check', 'transaction_sort_order_check']],
  ])('declares database checks for %s', (table, expectedNames) => {
    const names = getTableConfig(table).checks.map(({ name }) => name)
    expect(names).toEqual(expect.arrayContaining(expectedNames))
  })
})
