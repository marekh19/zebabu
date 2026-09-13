import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createMonthlyBudget: vi.fn(),
  getCompleteDefaultAllocationTargets: vi.fn(),
  listBudgets: vi.fn(),
}))

vi.mock('$lib/budget-planning/server', () => ({
  createMonthlyBudget: mocks.createMonthlyBudget,
  createScenarioBudget: vi.fn(),
  deleteBudget: vi.fn(),
  DuplicateMonthlyBudgetError: class extends Error {},
  DuplicateScenarioBudgetError: class extends Error {},
  getCompleteDefaultAllocationTargets:
    mocks.getCompleteDefaultAllocationTargets,
  handleDuplicateBudgetAction: vi.fn(),
  listBudgets: mocks.listBudgets,
}))

import { actions, load } from './+page.server'

function request(useDefaultAllocationTargets: boolean) {
  const body = new URLSearchParams({
    type: 'monthly',
    month: '9',
    year: '2026',
  })
  if (useDefaultAllocationTargets) {
    body.set('useDefaultAllocationTargets', 'true')
  }
  return new Request('http://localhost/budgets?/create', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
}

async function submit(useDefaultAllocationTargets: boolean) {
  const action = actions.create
  if (!action) throw new Error('create action is not defined')

  return Reflect.apply(action, undefined, [
    {
      request: request(useDefaultAllocationTargets),
      locals: { user: { id: 'user-1' } },
    },
  ])
}

describe('Budget creation allocation defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createMonthlyBudget.mockResolvedValue({ id: 'budget-1' })
    mocks.listBudgets.mockResolvedValue([])
  })

  it.each([true, false])(
    'passes the user default-target choice to Budget creation',
    async (useDefaultAllocationTargets) => {
      await expect(submit(useDefaultAllocationTargets)).rejects.toMatchObject({
        status: 303,
        location: '/budgets/budget-1',
      })

      expect(mocks.createMonthlyBudget).toHaveBeenCalledWith('user-1', {
        month: 9,
        year: 2026,
        useDefaultAllocationTargets,
      })
    },
  )

  it.each([
    [null, false],
    [[{ categoryId: 'rent', value: 100 }], true],
  ])(
    'offers defaults only when a complete set exists',
    async (targets, expected) => {
      mocks.getCompleteDefaultAllocationTargets.mockResolvedValue(targets)
      if (typeof load !== 'function') throw new Error('load is not defined')

      const result = await Reflect.apply(load, undefined, [
        { locals: { user: { id: 'user-1' } } },
      ])

      expect(result).toMatchObject({ hasDefaultAllocationTargets: expected })
    },
  )
})
