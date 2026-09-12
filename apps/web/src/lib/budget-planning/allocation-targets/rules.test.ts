import { describe, expect, it } from 'vitest'
import {
  areDefaultAllocationTargetsEnabled,
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
})
