export function isOwnedBudgetCategory(
  found: { budget: { userId: string } } | undefined,
  userId: string,
) {
  return found?.budget.userId === userId
}

export function nextTransactionSortOrder(
  lastTransaction: { sortOrder: number } | undefined,
) {
  return (lastTransaction?.sortOrder ?? -1) + 1
}

type TransactionPositions = Readonly<{
  sourceIds: readonly string[]
  targetIds: readonly string[]
}>

export function positionTransactionIds(
  sourceIds: readonly string[],
  targetIds: readonly string[],
  transactionId: string,
  targetIndex: number,
  sameCategory: boolean,
): TransactionPositions | undefined {
  const sourceIndex = sourceIds.indexOf(transactionId)
  if (sourceIndex === -1) return undefined

  const nextSourceIds = sourceIds.filter((id) => id !== transactionId)
  const destinationIds = sameCategory ? nextSourceIds : targetIds
  if (targetIndex < 0 || targetIndex > destinationIds.length) return undefined

  const nextTargetIds = [
    ...destinationIds.slice(0, targetIndex),
    transactionId,
    ...destinationIds.slice(targetIndex),
  ]

  return sameCategory
    ? { sourceIds: nextTargetIds, targetIds: nextTargetIds }
    : { sourceIds: nextSourceIds, targetIds: nextTargetIds }
}
