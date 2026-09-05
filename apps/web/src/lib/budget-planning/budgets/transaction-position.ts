import type {
  BudgetCategory,
  PlannedTransaction,
} from '$lib/budget-planning/model'

export type TransactionLocation = Readonly<{
  budgetCategoryId: string
  index: number
}>

export const TRANSACTION_DRAG_TYPE = 'transaction'
export const CATEGORY_DRAG_TYPE = 'budget-category'
export const getTransactionGroupId = (budgetCategoryId: string) =>
  `transactions:${budgetCategoryId}`

export function getTransactionLocation(
  categories: readonly BudgetCategory[],
  transactionId: string | number,
): TransactionLocation | undefined {
  for (const budgetCategory of categories) {
    const index = budgetCategory.transactions.findIndex(
      ({ id }) => id === transactionId,
    )
    if (index !== -1) return { budgetCategoryId: budgetCategory.id, index }
  }
}

export function getTransaction(
  categories: readonly BudgetCategory[],
  transactionId: string | number,
) {
  const location = getTransactionLocation(categories, transactionId)
  if (!location) return undefined

  return categories
    .find(({ id }) => id === location.budgetCategoryId)
    ?.transactions.at(location.index)
}

export function toTransactionGroups(
  categories: readonly BudgetCategory[],
  groupId: (budgetCategoryId: string) => string,
): Record<string, PlannedTransaction[]> {
  return Object.fromEntries(
    categories.map(({ id, transactions }) => [groupId(id), [...transactions]]),
  )
}

export function withTransactionGroups(
  categories: readonly BudgetCategory[],
  groups: Readonly<Record<string, readonly PlannedTransaction[]>>,
  groupId: (budgetCategoryId: string) => string,
): BudgetCategory[] {
  return categories.map((budgetCategory) => ({
    ...budgetCategory,
    transactions: groups[groupId(budgetCategory.id)] ?? [],
  }))
}

type CommitTransactionPositionInput = Readonly<{
  persist: () => Promise<Response>
  refresh: () => Promise<void>
  onBusyChange: (busy: boolean) => void
  onFailure: () => void
}>

export async function commitTransactionPosition({
  persist,
  refresh,
  onBusyChange,
  onFailure,
}: CommitTransactionPositionInput) {
  onBusyChange(true)

  try {
    const response = await persist()
    if (!response.ok) throw new Error('Transaction position update failed')
    await refresh()
    return true
  } catch {
    onFailure()
    return false
  } finally {
    onBusyChange(false)
  }
}
