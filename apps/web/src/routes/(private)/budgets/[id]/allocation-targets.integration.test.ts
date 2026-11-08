import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getBudget: vi.fn(),
  listCategories: vi.fn(),
  replaceAllocationTargets: vi.fn(),
}))

vi.mock('$lib/api/server-client', () => ({
  apiErrorCode: (error: unknown) =>
    error instanceof Error ? error.message : null,
  createServerApiClient: () => ({
    budgets: {
      get: mocks.getBudget,
      replaceAllocationTargets: mocks.replaceAllocationTargets,
    },
    categories: { list: mocks.listCategories },
  }),
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
    mocks.getBudget.mockReset()
    mocks.listCategories.mockReset()
    mocks.replaceAllocationTargets.mockReset()
    mocks.replaceAllocationTargets.mockResolvedValue({})
    mocks.listCategories.mockResolvedValue([])
  })

  it('initializes an unset Budget from matching current defaults', async () => {
    mocks.getBudget.mockResolvedValue({
      budget: budget([
        placement('rent-placement', 'rent', null),
        placement('food-placement', 'food', null),
      ]),
      availableCategories: [],
    })
    mocks.listCategories.mockResolvedValue([
      { id: 'rent', type: 'expense', defaultAllocationTarget: '60.0' },
      { id: 'food', type: 'expense', defaultAllocationTarget: '40.0' },
      {
        id: 'missing-from-budget',
        type: 'expense',
        defaultAllocationTarget: '0.0',
      },
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
    mocks.getBudget.mockResolvedValue({
      budget: budget([placement('rent-placement', 'rent', null)]),
      availableCategories: [],
    })
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

    expect(mocks.replaceAllocationTargets).toHaveBeenCalledWith({
      budgetId: 'budget-1',
      enabled: true,
      targets: [{ budgetCategoryId: 'placement-1', value: '100.0' }],
    })
    expect(result).toMatchObject({ allocationForm: { valid: true } })
  })

  it('rejects an invalid total before calling the service', async () => {
    const result = await submit(90)

    expect(mocks.replaceAllocationTargets).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: 400,
      data: { allocationForm: { valid: false } },
    })
  })

  it('does not expose an unowned Budget', async () => {
    mocks.replaceAllocationTargets.mockRejectedValue(new Error('NOT_FOUND'))

    const result = await submit(100)

    expect(result).toMatchObject({ status: 404 })
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
