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
