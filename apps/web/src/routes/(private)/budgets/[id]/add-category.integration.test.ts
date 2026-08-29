import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  addBudgetCategory: vi.fn(),
}))

vi.mock('$lib/budget-planning/server', () => ({
  addBudgetCategory: mocks.addBudgetCategory,
  deleteBudget: vi.fn(),
  findCategoriesNotInBudget: vi.fn(),
  getBudgetDetail: vi.fn(),
  handleDuplicateBudgetAction: vi.fn(),
}))

import { actions } from './+page.server'

function request(categoryId: string) {
  return new Request('http://localhost/budgets/budget-1?/addCategory', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ categoryId }),
  })
}

async function submit(categoryId: string) {
  const action = actions.addCategory
  if (!action) throw new Error('addCategory action is not defined')

  return Reflect.apply(action, undefined, [
    {
      request: request(categoryId),
      params: { id: 'budget-1' },
      locals: { user: { id: 'user-1' } },
    },
  ])
}

describe('adding an existing category to a budget', () => {
  beforeEach(() => {
    mocks.addBudgetCategory.mockReset()
  })

  it('adds the selected category and returns a visible error when it is unavailable', async () => {
    mocks.addBudgetCategory.mockResolvedValueOnce({})

    const success = await submit('category-1')

    expect(mocks.addBudgetCategory).toHaveBeenCalledWith(
      'budget-1',
      'user-1',
      'category-1',
    )
    expect(success).toMatchObject({ addCategoryForm: { valid: true } })

    mocks.addBudgetCategory.mockResolvedValueOnce({
      error: 'category_not_found',
    })

    const failure = await submit('category-2')

    expect(failure).toMatchObject({
      status: 404,
      data: { error: 'not_found', addCategoryForm: { valid: true } },
    })
  })
})
