type AllocationTargetAmount = {
  readonly value: number | undefined
}

export type AllocationTarget = Readonly<{
  categoryId: string
  value: number
}>

export type AllocationTargetsInput = Readonly<{
  enabled: boolean
  targets: readonly AllocationTarget[]
}>

type DefaultAllocationTarget = {
  readonly defaultAllocationTarget: string | null
}

export function totalAllocationTargetTenths(
  targets: readonly AllocationTargetAmount[],
) {
  return targets.reduce(
    (total, { value }) => total + Math.round((value ?? 0) * 10),
    0,
  )
}

export function isAllocationTargetInRange(value: number): boolean {
  return value >= 0 && value <= 100
}

export function hasAllocationTargetPrecision(value: number): boolean {
  return Number.isInteger(value * 10)
}

export function hasCompleteAllocationTargetTotal(
  targets: readonly AllocationTargetAmount[],
): boolean {
  return totalAllocationTargetTenths(targets) === 1000
}

export function isCompleteAllocationTargetSet(
  targets: readonly AllocationTarget[],
  categoryIds: readonly string[],
): boolean {
  const expectedIds = new Set(categoryIds)
  const submittedIds = new Set(targets.map(({ categoryId }) => categoryId))

  return (
    targets.length === expectedIds.size &&
    submittedIds.size === expectedIds.size &&
    targets.every(
      ({ categoryId, value }) =>
        expectedIds.has(categoryId) &&
        isAllocationTargetInRange(value) &&
        hasAllocationTargetPrecision(value),
    ) &&
    hasCompleteAllocationTargetTotal(targets)
  )
}

export function areDefaultAllocationTargetsEnabled(
  categories: readonly DefaultAllocationTarget[],
) {
  return (
    categories.length > 0 &&
    categories.every(
      ({ defaultAllocationTarget }) => defaultAllocationTarget !== null,
    )
  )
}
