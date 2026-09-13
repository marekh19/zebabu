import type { AllocationTarget } from './rules'

export function fillMatchingAllocationTargets(
  targets: readonly AllocationTarget[],
  defaults: readonly AllocationTarget[],
): AllocationTarget[] {
  const values = new Map(
    defaults.map(({ categoryId, value }) => [categoryId, value]),
  )
  return targets.map((target) => ({
    ...target,
    value: values.get(target.categoryId) ?? target.value,
  }))
}
