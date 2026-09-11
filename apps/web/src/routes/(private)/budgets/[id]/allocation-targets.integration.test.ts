import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getBudgetDetail: vi.fn(),
  getCompleteDefaultAllocationTargets: vi.fn(),
  saveBudgetAllocationTargets: vi.fn(),
}))

vi.mock('$lib/budget-planning/server', () => ({
  addBudgetCategory: vi.fn(),
  createTransaction: vi.fn(),
  deleteBudget: vi.fn(),
  deleteTransaction: vi.fn(),
  getBudgetDetail: mocks.getBudgetDetail,
  getCompleteDefaultAllocationTargets:
    mocks.getCompleteDefaultAllocationTargets,
  handleDuplicateBudgetAction: vi.fn(),
  InvalidBudgetAllocationTargetsError: class extends Error {},
  saveBudgetAllocationTargets: mocks.saveBudgetAllocationTargets,
  updateTransaction: vi.fn(),
}))

import { actions, load } from './+page.server'

function request(value: number) {
  const body = new FormData()
  body.set(
    '__superform_json',
    `[{"enabled":1,"targets":2},true,[3],{"categoryId":4,"value":5},"placement-1",${value}]`,
  )
  return new Request(
    'http://localhost/budgets/budget-1?/saveAllocationTargets',
    { method: 'POST', body },
  )
}

async function submit(value: number) {
  const action = actions.saveAllocationTargets
  if (!action) throw new Error('saveAllocationTargets action is not defined')

  return Reflect.apply(action, undefined, [
    {
      request: request(value),
      params: { id: 'budget-1' },
      locals: { user: { id: 'user-1' } },
    },
  ])
}

describe('Budget allocation target route', () => {
  beforeEach(() => {
    mocks.getBudgetDetail.mockReset()
    mocks.getCompleteDefaultAllocationTargets.mockReset()
    mocks.saveBudgetAllocationTargets.mockReset()
    mocks.saveBudgetAllocationTargets.mockResolvedValue({})
  })

  it('initializes an unset Budget from matching current defaults', async () => {
    mocks.getBudgetDetail.mockResolvedValue({
      budget: budget([
        placement('rent-placement', 'rent', null),
        placement('food-placement', 'food', null),
      ]),
      availableCategories: [],
    })
    mocks.getCompleteDefaultAllocationTargets.mockResolvedValue([
      { categoryId: 'rent', value: 60 },
      { categoryId: 'food', value: 40 },
      { categoryId: 'missing-from-budget', value: 0 },
    ])
    if (typeof load !== 'function') throw new Error('load is not defined')

    const result = await Reflect.apply(load, undefined, [
      {
        params: { id: 'budget-1' },
        locals: { user: { id: 'user-1' } },
        url: new URL('http://localhost/budgets/budget-1'),
      },
    ])

    expect(result).toMatchObject({
      allocationForm: {
        data: {
          enabled: false,
          targets: [
            { categoryId: 'rent-placement', value: 60 },
            { categoryId: 'food-placement', value: 40 },
          ],
        },
      },
      currentDefaultTargets: [
        { categoryId: 'rent-placement', value: 60 },
        { categoryId: 'food-placement', value: 40 },
      ],
    })
  })

  it('initializes a sole unset expense Category at 100%', async () => {
    mocks.getBudgetDetail.mockResolvedValue({
      budget: budget([placement('rent-placement', 'rent', null)]),
      availableCategories: [],
    })
    mocks.getCompleteDefaultAllocationTargets.mockResolvedValue(null)
    if (typeof load !== 'function') throw new Error('load is not defined')

    const result = await Reflect.apply(load, undefined, [
      {
        params: { id: 'budget-1' },
        locals: { user: { id: 'user-1' } },
        url: new URL('http://localhost/budgets/budget-1'),
      },
    ])

    expect(result).toMatchObject({
      allocationForm: {
        data: {
          enabled: false,
          targets: [{ categoryId: 'rent-placement', value: 100 }],
        },
      },
    })
  })

  it('saves a valid complete set for the owned Budget', async () => {
    const result = await submit(100)

    expect(mocks.saveBudgetAllocationTargets).toHaveBeenCalledWith(
      'budget-1',
      'user-1',
      {
        enabled: true,
        targets: [{ categoryId: 'placement-1', value: 100 }],
      },
    )
    expect(result).toMatchObject({ allocationForm: { valid: true } })
  })

  it('rejects an invalid total before calling the service', async () => {
    const result = await submit(90)

    expect(mocks.saveBudgetAllocationTargets).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: 400,
      data: { allocationForm: { valid: false } },
    })
  })

  it('does not expose an unowned Budget', async () => {
    mocks.saveBudgetAllocationTargets.mockResolvedValue({
      error: 'access_denied',
    })

    const result = await submit(100)

    expect(result).toMatchObject({ status: 403 })
  })
})

function placement(
  id: string,
  categoryId: string,
  allocationTarget: string | null,
) {
  return {
    id,
    allocationTarget,
    category: {
      id: categoryId,
      name: categoryId,
      type: 'expense',
      color: 'slate',
      defaultAllocationTarget: null,
    },
    transactions: [],
  }
}

function budget(budgetCategories: ReturnType<typeof placement>[]) {
  return {
    id: 'budget-1',
    type: 'scenario',
    name: 'Move',
    month: null,
    year: null,
    budgetCategories,
  }
}
