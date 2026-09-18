import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  listCategories: vi.fn(),
  replaceAllocationTargets: vi.fn(),
}))

vi.mock('$lib/api/server-client', () => ({
  apiErrorCode: () => null,
  createServerApiClient: () => ({
    categories: {
      list: mocks.listCategories,
      replaceAllocationTargets: mocks.replaceAllocationTargets,
    },
  }),
}))

import { actions, load } from './+page.server'

function request(values: readonly number[]) {
  const body = new FormData()
  body.set(
    '__superform_json',
    `[{"enabled":1,"targets":2},true,[3],{"categoryId":4,"value":5},"category-1",${values[0]}]`,
  )
  return new Request('http://localhost/categories?/saveAllocationTargets', {
    method: 'POST',
    body,
  })
}

async function submit(values: readonly number[]) {
  const action = actions.saveAllocationTargets
  if (!action) throw new Error('saveAllocationTargets action is not defined')

  return Reflect.apply(action, undefined, [
    {
      request: request(values),
      locals: { user: { id: 'user-1' } },
    },
  ])
}

describe('default allocation target route', () => {
  beforeEach(() => {
    mocks.listCategories.mockReset()
    mocks.replaceAllocationTargets.mockReset()
  })

  it.each([
    [[category('expense-1', null)], [100]],
    [
      [
        category('income-1', null, 'income'),
        category('expense-1', null),
        category('expense-2', null),
      ],
      [0, 0],
    ],
  ])('initializes an unconfigured expense set', async (categories, values) => {
    mocks.listCategories.mockResolvedValue(categories)
    if (typeof load !== 'function') throw new Error('load is not defined')

    const result = await Reflect.apply(load, undefined, [
      { locals: { user: { id: 'user-1' } } },
    ])

    expect(result).toMatchObject({
      allocationForm: {
        data: {
          enabled: false,
          targets: values.map((value, index) => ({
            categoryId: `expense-${index + 1}`,
            value,
          })),
        },
      },
    })
  })

  it('saves a valid complete set for the authenticated user', async () => {
    const result = await submit([100])

    expect(result).toMatchObject({ allocationForm: { valid: true } })
    expect(mocks.replaceAllocationTargets).toHaveBeenCalledWith({
      enabled: true,
      targets: [{ categoryId: 'category-1', value: '100.0' }],
    })
  })

  it('rejects an invalid total before calling the service', async () => {
    const result = await submit([90])

    expect(mocks.replaceAllocationTargets).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: 400,
      data: { allocationForm: { valid: false } },
    })
  })
})

function category(
  id: string,
  defaultAllocationTarget: string | null,
  type: 'income' | 'expense' = 'expense',
) {
  return {
    id,
    name: id,
    type,
    color: 'slate' as const,
    defaultAllocationTarget,
    budgetUsageCount: 0,
  }
}
