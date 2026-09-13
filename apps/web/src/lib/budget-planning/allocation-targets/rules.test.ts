import { describe, expect, it } from 'vitest'
import {
  areDefaultAllocationTargetsEnabled,
  isCompleteAllocationTargetSet,
  totalAllocationTargetTenths,
} from './rules'

describe('allocation target rules', () => {
  it('treats an empty target as zero in the running total', () => {
    expect(
      totalAllocationTargetTenths([{ value: 60 }, { value: undefined }]),
    ).toBe(600)
  })

  it.each([
    [[], false],
    [[{ defaultAllocationTarget: null }], false],
    [[{ defaultAllocationTarget: '100.0' }], true],
  ])('detects whether default targets are enabled', (categories, enabled) => {
    expect(areDefaultAllocationTargetsEnabled(categories)).toBe(enabled)
  })

  it.each([
    [
      [
        { categoryId: 'rent', value: -0.1 },
        { categoryId: 'food', value: 100.1 },
      ],
      ['rent', 'food'],
    ],
    [
      [
        { categoryId: 'rent', value: 33.33 },
        { categoryId: 'food', value: 66.67 },
      ],
      ['rent', 'food'],
    ],
    [[{ categoryId: 'rent', value: 100 }], ['rent', 'food']],
  ])('rejects an invalid complete target set', (targets, categoryIds) => {
    expect(isCompleteAllocationTargetSet(targets, categoryIds)).toBe(false)
  })

  it('accepts a valid complete target set', () => {
    expect(
      isCompleteAllocationTargetSet(
        [
          { categoryId: 'rent', value: 60 },
          { categoryId: 'food', value: 40 },
        ],
        ['rent', 'food'],
      ),
    ).toBe(true)
  })
})
