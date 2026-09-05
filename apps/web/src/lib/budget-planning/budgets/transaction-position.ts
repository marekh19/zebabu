import type {
  BudgetCategory,
  PlannedTransaction,
} from '$lib/budget-planning/model'

export type TransactionLocation = Readonly<{
  budgetCategoryId: string
  index: number
}>

export type TransactionPositionCommand = Readonly<{
  targetBudgetCategoryId: string
  targetIndex: number
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
): Record<string, PlannedTransaction[]> {
  return Object.fromEntries(
    categories.map(({ id, transactions }) => [
      getTransactionGroupId(id),
      [...transactions],
    ]),
  )
}

export function withTransactionGroups(
  categories: readonly BudgetCategory[],
  groups: Readonly<Record<string, readonly PlannedTransaction[]>>,
): BudgetCategory[] {
  return categories.map((budgetCategory) => ({
    ...budgetCategory,
    transactions: groups[getTransactionGroupId(budgetCategory.id)] ?? [],
  }))
}

export function getTransactionPositionCommand(
  previous: TransactionLocation | undefined,
  current: TransactionLocation | undefined,
): TransactionPositionCommand | undefined {
  if (!previous || !current) return undefined
  if (
    previous.budgetCategoryId === current.budgetCategoryId &&
    previous.index === current.index
  ) {
    return undefined
  }

  return {
    targetBudgetCategoryId: current.budgetCategoryId,
    targetIndex: current.index,
  }
}

type CommitTransactionPositionInput = Readonly<{
  persist: () => Promise<Response>
  refresh: () => Promise<void>
  onBusyChange: (busy: boolean) => void
  onRollback: () => void
  onError: () => void
  onSettled: () => Promise<void>
}>

export async function commitTransactionPosition({
  persist,
  refresh,
  onBusyChange,
  onRollback,
  onError,
  onSettled,
}: CommitTransactionPositionInput) {
  onBusyChange(true)

  try {
    const response = await persist()
    if (!response.ok) throw new Error('Transaction position update failed')
  } catch {
    onRollback()
    onError()
    onBusyChange(false)
    await onSettled()
    return false
  }

  await refresh().catch(() => undefined)
  onBusyChange(false)
  await onSettled()
  return true
}
