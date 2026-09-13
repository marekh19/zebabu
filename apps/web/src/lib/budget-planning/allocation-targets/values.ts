export type AllocationTargetValue = Readonly<{
  categoryId: string
  value: number
}>

export function fillMatchingAllocationTargets(
  targets: readonly AllocationTargetValue[],
  defaults: readonly AllocationTargetValue[],
): AllocationTargetValue[] {
  const values = new Map(
    defaults.map(({ categoryId, value }) => [categoryId, value]),
  )
  return targets.map((target) => ({
    ...target,
    value: values.get(target.categoryId) ?? target.value,
  }))
}
