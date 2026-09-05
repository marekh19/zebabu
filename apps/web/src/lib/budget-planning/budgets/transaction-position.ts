import type {
  BudgetCategory,
  PlannedTransaction,
} from '$lib/budget-planning/model'
import { arrayMove } from '@dnd-kit/helpers'

export type TransactionLocation = Readonly<{
  budgetCategoryId: string
  index: number
}>

export type TransactionPositionCommand = Readonly<{
  targetBudgetCategoryId: string
  targetIndex: number
}>

export type TransactionDragDirection = 'up' | 'down' | 'left' | 'right'

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

export function moveTransactionByKeyboard(
  categories: readonly BudgetCategory[],
  transactionId: string,
  direction: TransactionDragDirection,
): BudgetCategory[] {
  const location = getTransactionLocation(categories, transactionId)
  if (!location) return [...categories]

  const sourceCategoryIndex = categories.findIndex(
    ({ id }) => id === location.budgetCategoryId,
  )
  const sourceCategory = categories.at(sourceCategoryIndex)
  if (!sourceCategory) return [...categories]

  if (direction === 'up' || direction === 'down') {
    const offset = direction === 'up' ? -1 : 1
    const targetIndex = Math.max(
      0,
      Math.min(location.index + offset, sourceCategory.transactions.length - 1),
    )
    if (targetIndex === location.index) return [...categories]

    const transactions = arrayMove(
      [...sourceCategory.transactions],
      location.index,
      targetIndex,
    )

    return categories.map((category) =>
      category.id === sourceCategory.id
        ? { ...category, transactions }
        : category,
    )
  }

  const categoryOffset = direction === 'left' ? -1 : 1
  const targetCategory = categories.at(sourceCategoryIndex + categoryOffset)
  if (!targetCategory) return [...categories]

  const transaction = sourceCategory.transactions.at(location.index)
  if (!transaction) return [...categories]

  const targetIndex = Math.min(
    location.index,
    targetCategory.transactions.length,
  )
  const targetTransactions = [
    ...targetCategory.transactions.slice(0, targetIndex),
    transaction,
    ...targetCategory.transactions.slice(targetIndex),
  ]

  return categories.map((category) => {
    if (category.id === sourceCategory.id) {
      return {
        ...category,
        transactions: category.transactions.filter(
          ({ id }) => id !== transactionId,
        ),
      }
    }
    if (category.id === targetCategory.id) {
      return { ...category, transactions: targetTransactions }
    }
    return category
  })
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
    await refresh().catch(() => undefined)
    return true
  } catch {
    onRollback()
    onError()
    return false
  } finally {
    onBusyChange(false)
    await onSettled()
  }
}
