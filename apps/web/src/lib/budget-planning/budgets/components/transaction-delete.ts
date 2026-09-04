export function getTransactionDeleteFocusId(
  budgetCategoryId: string,
  transactions: readonly { readonly id: string }[],
  transactionId: string,
) {
  const index = transactions.findIndex(({ id }) => id === transactionId)
  const next = transactions[index + 1]
  const previous = transactions[index - 1]

  if (next) return `transaction-${next.id}`
  if (previous) return `transaction-${previous.id}`
  return `add-transaction-${budgetCategoryId}`
}
