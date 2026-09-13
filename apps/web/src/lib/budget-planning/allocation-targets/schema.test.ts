import { describe, expect, it } from 'vitest'
import { createAllocationTargetsSchema } from './schema'

const schema = createAllocationTargetsSchema()

const targets = (values: readonly number[]) => ({
  enabled: true,
  targets: values.map((value, index) => ({
    categoryId: `category-${index}`,
    value,
  })),
})

describe('allocation target validation', () => {
  it.each([-0.1, 100.1])('rejects %s outside the percentage range', (value) => {
    expect(schema.safeParse(targets([value, 100 - value])).success).toBe(false)
  })

  it('rejects more than one decimal place', () => {
    expect(schema.safeParse(targets([25.55, 74.45])).success).toBe(false)
  })

  it.each([
    [[40, 59.9], false],
    [[40, 60], true],
    [[40, 60.1], false],
  ])('validates an exact 100.0%% total', (values, valid) => {
    expect(schema.safeParse(targets(values)).success).toBe(valid)
  })

  it('allows the complete set to be disabled', () => {
    expect(schema.safeParse({ enabled: false, targets: [] }).success).toBe(true)
  })
})
