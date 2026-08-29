import { budget, category, user } from '$lib/server/persistence/schema'
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
})
