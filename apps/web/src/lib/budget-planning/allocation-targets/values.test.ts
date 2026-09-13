import { describe, expect, it } from 'vitest'
import { fillMatchingAllocationTargets } from './values'

describe('fillMatchingAllocationTargets', () => {
  it('fills matching Categories without changing missing Categories', () => {
    expect(
      fillMatchingAllocationTargets(
        [
          { categoryId: 'rent', value: 50 },
          { categoryId: 'new-category', value: 50 },
        ],
        [{ categoryId: 'rent', value: 70 }],
      ),
    ).toEqual([
      { categoryId: 'rent', value: 70 },
      { categoryId: 'new-category', value: 50 },
    ])
  })
})
