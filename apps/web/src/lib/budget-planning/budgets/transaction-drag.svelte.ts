import { invalidateAll } from '$app/navigation'
import { resolve } from '$app/paths'
import type { BudgetCategory } from '$lib/budget-planning/model'
import * as m from '$lib/paraglide/messages'
import type { DragDropEvents } from '@dnd-kit-svelte/svelte'
import { move } from '@dnd-kit/helpers'
import { tick } from 'svelte'
import { toast } from 'svelte-sonner'
import {
  getTransaction,
  getTransactionLocation,
  getTransactionPositionCommand,
  moveTransactionByKeyboard,
  toTransactionGroups,
  TRANSACTION_DRAG_TYPE,
  withTransactionGroups,
  type TransactionDragDirection,
} from './transaction-position'

type DragStartEvent = Parameters<DragDropEvents['dragstart']>[0]
type DragOverEvent = Parameters<DragDropEvents['dragover']>[0]
type DragEndEvent = Parameters<DragDropEvents['dragend']>[0]

const KEYBOARD_DIRECTIONS: Partial<Record<string, TransactionDragDirection>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

type CommitTransactionPositionInput = Readonly<{
  persist: () => Promise<Response>
  refresh: () => Promise<void>
  onBusyChange: (busy: boolean) => void
  onRollback: () => void
  onSettled: () => Promise<void>
}>

export type TransactionPositionCommitResult =
  'saved' | 'save-failed' | 'refresh-failed'

export async function commitTransactionPosition({
  persist,
  refresh,
  onBusyChange,
  onRollback,
  onSettled,
}: CommitTransactionPositionInput): Promise<TransactionPositionCommitResult> {
  onBusyChange(true)

  try {
    const response = await persist()
    if (!response.ok) {
      onRollback()
      return 'save-failed'
    }

    try {
      await refresh()
      return 'saved'
    } catch {
      return 'refresh-failed'
    }
  } catch {
    onRollback()
    return 'save-failed'
  } finally {
    onBusyChange(false)
    await onSettled()
  }
}

type TransactionDragInput = Readonly<{
  getBudgetId: () => string
  getItems: () => readonly BudgetCategory[]
  setItems: (items: BudgetCategory[]) => void
  refresh?: () => Promise<void>
}>

function copyItems(categories: readonly BudgetCategory[]) {
  return categories.map((budgetCategory) => ({
    ...budgetCategory,
    transactions: [...budgetCategory.transactions],
  }))
}

export function createTransactionDrag({
  getBudgetId,
  getItems,
  setItems,
  refresh = invalidateAll,
}: TransactionDragInput) {
  let busy = $state(false)
  let startItems = $state<readonly BudgetCategory[]>([])
  let activeId = $state<string>()
  let targetCategoryId = $state<string>()
  let announcement = $state('')

  function findCategoryName(budgetCategoryId: string) {
    return (
      getItems().find(({ id }) => id === budgetCategoryId)?.category.name ?? ''
    )
  }

  function announcePosition(
    transactionId: string,
    message: typeof m.budget_detail_transaction_drag_move,
  ) {
    const items = getItems()
    const transaction = getTransaction(items, transactionId)
    const location = getTransactionLocation(items, transactionId)
    if (!transaction || !location) return

    const count =
      items.find(({ id }) => id === location.budgetCategoryId)?.transactions
        .length ?? 0
    announcement = message({
      name: transaction.name,
      category: findCategoryName(location.budgetCategoryId),
      position: location.index + 1,
      count,
    })
  }

  async function focusHandle(transactionId: string) {
    await tick()
    const handle = document.getElementById(`transaction-drag-${transactionId}`)
    handle?.focus()
    handle?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  function showRefreshError(transactionName: string) {
    const message = m.budget_detail_transaction_drag_refresh_error({
      name: transactionName,
    })
    announcement = message
    toast.error(message, {
      action: {
        label: m.budget_detail_transaction_drag_retry(),
        onClick: () => {
          void refresh().catch(() => showRefreshError(transactionName))
        },
      },
    })
  }

  function handleDragStart(event: DragStartEvent) {
    const source = event.operation.source
    if (!source || source.type !== TRANSACTION_DRAG_TYPE) return

    startItems = copyItems(getItems())
    activeId = String(source.id)
    announcePosition(activeId, m.budget_detail_transaction_drag_pickup)
  }

  function handleDragOver(event: DragOverEvent) {
    const source = event.operation.source
    if (!source || source.type !== TRANSACTION_DRAG_TYPE) return

    const items = getItems()
    const groups = move(toTransactionGroups(items), event)
    const nextItems = withTransactionGroups(items, groups)
    setItems(nextItems)

    const transactionId = String(source.id)
    targetCategoryId = getTransactionLocation(
      nextItems,
      transactionId,
    )?.budgetCategoryId
    announcePosition(transactionId, m.budget_detail_transaction_drag_move)
  }

  async function handleDragKeyDown(
    transactionId: string,
    event: KeyboardEvent,
  ) {
    if (activeId !== transactionId) return

    const direction = KEYBOARD_DIRECTIONS[event.code]
    if (!direction) return

    event.preventDefault()
    event.stopPropagation()
    const nextItems = moveTransactionByKeyboard(
      getItems(),
      transactionId,
      direction,
    )
    setItems(nextItems)

    targetCategoryId = getTransactionLocation(
      nextItems,
      transactionId,
    )?.budgetCategoryId
    announcePosition(transactionId, m.budget_detail_transaction_drag_move)
    await focusHandle(transactionId)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const source = event.operation.source
    if (!source || source.type !== TRANSACTION_DRAG_TYPE) return

    const transactionId = String(source.id)
    const transaction = getTransaction(startItems, transactionId)
    const previous = getTransactionLocation(startItems, transactionId)
    const current = getTransactionLocation(getItems(), transactionId)
    const canceled = event.canceled || !event.operation.target
    const command = getTransactionPositionCommand(previous, current)

    if (canceled || !command) {
      setItems(copyItems(startItems))
      if (transaction) {
        announcement = m.budget_detail_transaction_drag_cancel({
          name: transaction.name,
        })
      }
      await focusHandle(transactionId)
      clearDragState()
      return
    }

    announcePosition(transactionId, m.budget_detail_transaction_drag_drop)
    const result = await commitTransactionPosition({
      persist: () =>
        fetch(
          resolve(
            `/budgets/${getBudgetId()}/transactions/${transactionId}/position`,
          ),
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
          },
        ),
      refresh,
      onBusyChange: (nextBusy) => (busy = nextBusy),
      onRollback: () => setItems(copyItems(startItems)),
      onSettled: () => focusHandle(transactionId),
    })

    if (result === 'save-failed' && transaction) {
      announcement = m.budget_detail_transaction_drag_error({
        name: transaction.name,
      })
      toast.error(
        m.budget_detail_transaction_drag_error({ name: transaction.name }),
      )
    }
    if (result === 'refresh-failed' && transaction) {
      showRefreshError(transaction.name)
    }

    clearDragState()
  }

  function clearDragState() {
    targetCategoryId = undefined
    activeId = undefined
  }

  return {
    get busy() {
      return busy
    },
    get activeId() {
      return activeId
    },
    get targetCategoryId() {
      return targetCategoryId
    },
    get announcement() {
      return announcement
    },
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragKeyDown,
  }
}
