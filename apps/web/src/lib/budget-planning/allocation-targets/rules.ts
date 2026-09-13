type AllocationTargetValue = {
  readonly value: number | undefined
}

type DefaultAllocationTarget = {
  readonly defaultAllocationTarget: string | null
}

export function totalAllocationTargetTenths(
  targets: readonly AllocationTargetValue[],
) {
  return targets.reduce(
    (total, { value }) => total + Math.round((value ?? 0) * 10),
    0,
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
