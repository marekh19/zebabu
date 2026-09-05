<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import { tick } from 'svelte'
  import { toast } from 'svelte-sonner'
  import { ensureDefined } from 'narrowland'
  import ConfirmDialog from '$lib/components/confirm-dialog.svelte'
  import CategoryColumn from './category-column.svelte'
  import AddCategoryColumn from './add-category-column.svelte'
  import {
    DragDropProvider,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    type DragDropEvents,
  } from '@dnd-kit-svelte/svelte'
  import { move } from '@dnd-kit/helpers'
  import {
    Accessibility,
    AutoScroller,
    Cursor,
    Feedback,
    PreventSelection,
  } from '@dnd-kit/dom'
  import type {
    AvailableCategory,
    BudgetCategory,
    PlannedTransaction,
  } from '$lib/budget-planning/model'
  import type { addBudgetCategorySchema } from '../schemas/add-budget-category-schema'
  import type { Infer, SuperValidated } from 'sveltekit-superforms'
  import type {
    AddBudgetCategoryError,
    CreateTransactionError,
    UpdateTransactionError,
  } from '$lib/budget-planning/errors'
  import CreateTransactionDialog from './create-transaction-dialog.svelte'
  import type { createCreateTransactionSchema } from '../schemas/create-transaction-schema'
  import type { createUpdateTransactionSchema } from '../schemas/update-transaction-schema'
  import EditTransactionDialog from './edit-transaction-dialog.svelte'
  import { createPaidToggleQueue } from '../paid-toggle-queue'
  import { getTransactionDeleteFocusId } from './transaction-delete'
  import TransactionRow from './transaction-row.svelte'
  import {
    CATEGORY_DRAG_TYPE,
    commitTransactionPosition,
    getTransaction,
    getTransactionLocation,
    getTransactionPositionCommand,
    toTransactionGroups,
    TRANSACTION_DRAG_TYPE,
    withTransactionGroups,
  } from '../transaction-position'

  type DragStartEvent = Parameters<DragDropEvents['dragstart']>[0]
  type DragOverEvent = Parameters<DragDropEvents['dragover']>[0]
  type DragEndEvent = Parameters<DragDropEvents['dragend']>[0]

  type Props = {
    budgetCategories: readonly BudgetCategory[]
    availableCategories: readonly AvailableCategory[]
    addCategoryForm: SuperValidated<Infer<typeof addBudgetCategorySchema>>
    addCategoryError: AddBudgetCategoryError | undefined
    createTransactionForm: SuperValidated<
      Infer<ReturnType<typeof createCreateTransactionSchema>>
    >
    createTransactionError: CreateTransactionError | undefined
    initialTransactionCategoryId: string | undefined
    updateTransactionForm: SuperValidated<
      Infer<ReturnType<typeof createUpdateTransactionSchema>>
    >
    updateTransactionError: UpdateTransactionError | undefined
    initialEditTransactionId: string | undefined
  }

  let {
    budgetCategories,
    availableCategories,
    addCategoryForm,
    addCategoryError,
    createTransactionForm,
    createTransactionError,
    initialTransactionCategoryId,
    updateTransactionForm,
    updateTransactionError,
    initialEditTransactionId,
  }: Props = $props()

  let items = $derived(budgetCategories.map((bc) => ({ ...bc })))
  let lastPersistedIds = $derived(budgetCategories.map((bc) => bc.id))
  let paidBusyTransactionIds = $state<readonly string[]>([])
  let transactionDragBusy = $state(false)
  let transactionDragStartItems = $state<readonly BudgetCategory[]>([])
  let transactionTargetCategoryId = $state<string>()
  let transactionDragAnnouncement = $state('')

  const sensors = [PointerSensor, KeyboardSensor]
  const plugins = [
    Accessibility.configure({
      screenReaderInstructions: {
        draggable: m.budget_detail_drag_instructions(),
      },
      announcements: {
        dragstart: (event: DragStartEvent) => {
          const source = event.operation.source
          if (!source || source.type !== CATEGORY_DRAG_TYPE) return undefined

          const category = items.find(({ id }) => id === source.id)
          if (!category) return undefined
          return m.budget_detail_category_drag_pickup({
            name: category.category.name,
          })
        },
        dragover: (event: DragOverEvent) => {
          const source = event.operation.source
          if (!source || source.type !== CATEGORY_DRAG_TYPE) return undefined

          const position = items.findIndex(({ id }) => id === source.id)
          const category = items.at(position)
          if (!category || position === -1) return undefined
          return m.budget_detail_category_drag_move({
            name: category.category.name,
            position: position + 1,
            count: items.length,
          })
        },
        dragend: (event: DragEndEvent) => {
          const source = event.operation.source
          if (!source || source.type !== CATEGORY_DRAG_TYPE) return undefined

          const position = items.findIndex(({ id }) => id === source.id)
          const category = items.at(position)
          if (!category || position === -1) return undefined
          return event.canceled
            ? m.budget_detail_category_drag_cancel({
                name: category.category.name,
              })
            : m.budget_detail_category_drag_drop({
                name: category.category.name,
                position: position + 1,
                count: items.length,
              })
        },
      },
    }),
    AutoScroller,
    Cursor,
    Feedback,
    PreventSelection,
  ]

  // svelte-ignore state_referenced_locally
  // The query parameter only seeds the dialog; later selection is local UI state.
  let selectedBudgetCategory = $state(
    budgetCategories.find(({ id }) => id === initialTransactionCategoryId),
  )
  // svelte-ignore state_referenced_locally
  let transactionDialogOpen = $state(selectedBudgetCategory !== undefined)

  // svelte-ignore state_referenced_locally
  // The submitted transaction id only seeds a non-enhanced validation failure.
  let selectedTransaction = $state(
    budgetCategories
      .flatMap(({ transactions }) => transactions)
      .find(({ id }) => id === initialEditTransactionId),
  )
  // svelte-ignore state_referenced_locally
  let editDialogOpen = $state(selectedTransaction !== undefined)
  let editTrigger: HTMLElement | undefined

  type DeleteSelection = {
    readonly transaction: PlannedTransaction
    readonly focusId: string
  }

  let deleteSelection = $state<DeleteSelection>()
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteTrigger: HTMLElement | undefined
  let deleteForm = $state<HTMLFormElement>()

  function openTransactionDialog(budgetCategory: BudgetCategory) {
    selectedBudgetCategory = budgetCategory
    transactionDialogOpen = true
  }

  function openEditDialog(
    transaction: PlannedTransaction,
    trigger: HTMLElement,
  ) {
    editTrigger = trigger
    selectedTransaction = transaction
    editDialogOpen = true
  }

  function handleEditOpenChange(open: boolean) {
    editDialogOpen = open
    if (open) return

    editTrigger?.focus()
    editTrigger = undefined
    selectedTransaction = undefined
  }

  function updatePaidState(transactionId: string, isPaid: boolean) {
    items = items.map((budgetCategory) => ({
      ...budgetCategory,
      transactions: budgetCategory.transactions.map((transaction) =>
        transaction.id === transactionId
          ? { ...transaction, isPaid }
          : transaction,
      ),
    }))

    if (selectedTransaction?.id === transactionId) {
      selectedTransaction = { ...selectedTransaction, isPaid }
    }
  }

  function updatePaidBusyState(transactionId: string, isBusy: boolean) {
    paidBusyTransactionIds = isBusy
      ? [...paidBusyTransactionIds, transactionId]
      : paidBusyTransactionIds.filter((id) => id !== transactionId)
  }

  const paidToggleQueue = createPaidToggleQueue({
    persist: async (transactionId, isPaid) => {
      const response = await fetch(
        resolve(
          `/budgets/${page.params.id}/transactions/${transactionId}/paid`,
        ),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPaid }),
        },
      )

      if (!response.ok) throw new Error('Paid state update failed')
    },
    onChange: updatePaidState,
    onBusyChange: updatePaidBusyState,
    onError: () => toast.error(m.budget_detail_transaction_paid_error()),
  })

  function openDeleteDialog(
    transaction: PlannedTransaction,
    trigger: HTMLElement,
  ) {
    const budgetCategory = items.find(({ transactions }) =>
      transactions.some(({ id }) => id === transaction.id),
    )
    if (!budgetCategory) return

    deleteSelection = {
      transaction,
      focusId: getTransactionDeleteFocusId(
        budgetCategory.id,
        budgetCategory.transactions,
        transaction.id,
      ),
    }
    deleteTrigger = trigger
    deleteDialogOpen = true
  }

  async function handleDeleteOpenChange(open: boolean) {
    if (deleting && !open) return

    deleteDialogOpen = open
    if (open) return

    const trigger = deleteTrigger
    deleteSelection = undefined
    deleteTrigger = undefined
    await tick()
    trigger?.focus()
  }

  function copyItems(categories: readonly BudgetCategory[]) {
    return categories.map((budgetCategory) => ({
      ...budgetCategory,
      transactions: [...budgetCategory.transactions],
    }))
  }

  function findCategoryName(budgetCategoryId: string) {
    return items.find(({ id }) => id === budgetCategoryId)?.category.name ?? ''
  }

  function announceTransactionPosition(
    transactionId: string,
    message: typeof m.budget_detail_transaction_drag_move,
  ) {
    const transaction = getTransaction(items, transactionId)
    const location = getTransactionLocation(items, transactionId)
    if (!transaction || !location) return

    const count =
      items.find(({ id }) => id === location.budgetCategoryId)?.transactions
        .length ?? 0
    transactionDragAnnouncement = message({
      name: transaction.name,
      category: findCategoryName(location.budgetCategoryId),
      position: location.index + 1,
      count,
    })
  }

  function focusTransactionHandle(transactionId: string) {
    return tick().then(() =>
      document.getElementById(`transaction-drag-${transactionId}`)?.focus(),
    )
  }

  function handleDragStart(event: DragStartEvent) {
    const source = event.operation.source
    if (!source) return

    transactionDragStartItems = copyItems(items)
    if (source.type !== TRANSACTION_DRAG_TYPE) return

    const transactionId = String(source.id)
    announceTransactionPosition(
      transactionId,
      m.budget_detail_transaction_drag_pickup,
    )
  }

  function handleDragOver(event: DragOverEvent) {
    const source = event.operation.source
    if (!source) return

    if (source.type === CATEGORY_DRAG_TYPE) {
      items = move(items, event)
      return
    }

    if (source.type !== TRANSACTION_DRAG_TYPE) return

    const groups = move(toTransactionGroups(items), event)
    items = withTransactionGroups(items, groups)

    const transactionId = String(source.id)
    const location = getTransactionLocation(items, transactionId)
    transactionTargetCategoryId = location?.budgetCategoryId
    announceTransactionPosition(
      transactionId,
      m.budget_detail_transaction_drag_move,
    )
  }

  async function handleCategoryDragEnd(event: DragEndEvent) {
    if (event.canceled || !event.operation.target) {
      items = copyItems(transactionDragStartItems)
      return
    }

    const currentIds = items.map((item) => item.id)

    if (currentIds.every((id, i) => lastPersistedIds[i] === id)) return

    const previousIds = lastPersistedIds
    lastPersistedIds = currentIds

    try {
      const response = await fetch(
        resolve(`/budgets/${page.params.id}/reorder`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            items.map((item, index) => ({ id: item.id, sortOrder: index })),
          ),
        },
      )

      if (!response.ok) {
        throw new Error('Reorder failed')
      }
    } catch {
      lastPersistedIds = previousIds
      items = budgetCategories.map((bc) => ({ ...bc }))
      toast.error(m.budget_detail_reorder_error())
    }
  }

  async function handleTransactionDragEnd(event: DragEndEvent) {
    const source = event.operation.source
    if (!source) return

    const transactionId = String(source.id)
    const transaction = getTransaction(transactionDragStartItems, transactionId)
    const previous = getTransactionLocation(
      transactionDragStartItems,
      transactionId,
    )
    const current = getTransactionLocation(items, transactionId)
    const canceled = event.canceled || !event.operation.target
    const command = getTransactionPositionCommand(previous, current)

    if (canceled || !command) {
      items = copyItems(transactionDragStartItems)
      if (transaction) {
        transactionDragAnnouncement = m.budget_detail_transaction_drag_cancel({
          name: transaction.name,
        })
      }
      await focusTransactionHandle(transactionId)
      return
    }

    announceTransactionPosition(
      transactionId,
      m.budget_detail_transaction_drag_drop,
    )

    await commitTransactionPosition({
      persist: () =>
        fetch(
          resolve(
            `/budgets/${page.params.id}/transactions/${transactionId}/position`,
          ),
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
          },
        ),
      refresh: invalidateAll,
      onBusyChange: (busy) => (transactionDragBusy = busy),
      onRollback: () => {
        items = copyItems(transactionDragStartItems)
      },
      onError: () => {
        if (!transaction) return

        transactionDragAnnouncement = m.budget_detail_transaction_drag_error({
          name: transaction.name,
        })
        toast.error(
          m.budget_detail_transaction_drag_error({ name: transaction.name }),
        )
      },
      onSettled: () => focusTransactionHandle(transactionId),
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const sourceType = event.operation.source?.type

    if (sourceType === TRANSACTION_DRAG_TYPE) {
      await handleTransactionDragEnd(event)
    } else if (sourceType === CATEGORY_DRAG_TYPE) {
      await handleCategoryDragEnd(event)
    }

    transactionTargetCategoryId = undefined
  }

  function findItemBySourceId(sourceId: string | number) {
    return items.find((bc) => bc.id === sourceId)
  }
</script>

<div
  class="max-w-full snap-x snap-mandatory overflow-x-auto pb-4 sm:snap-none"
  aria-busy={transactionDragBusy}
>
  <DragDropProvider
    {sensors}
    {plugins}
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
  >
    <div class="flex gap-4">
      {#each items as bc, index (bc.id)}
        <CategoryColumn
          budgetCategory={bc}
          {index}
          onAddTransaction={openTransactionDialog}
          onEditTransaction={openEditDialog}
          onToggleTransactionPaid={(transaction) =>
            paidToggleQueue.toggle(transaction.id, transaction.isPaid)}
          {paidBusyTransactionIds}
          onDeleteTransaction={openDeleteDialog}
          {transactionDragBusy}
          {transactionTargetCategoryId}
        />
      {/each}
      {#if availableCategories.length > 0}
        <AddCategoryColumn
          {availableCategories}
          {addCategoryForm}
          {addCategoryError}
        />
      {/if}
    </div>

    <DragOverlay>
      {#snippet children(source)}
        {@const item = findItemBySourceId(source.id)}
        {@const transaction = getTransaction(items, source.id)}
        {#if source.type === CATEGORY_DRAG_TYPE && item}
          <CategoryColumn budgetCategory={item} index={0} isOverlay />
        {:else if source.type === TRANSACTION_DRAG_TYPE && transaction}
          <TransactionRow {transaction} isOverlay />
        {/if}
      {/snippet}
    </DragOverlay>
  </DragDropProvider>
</div>

<p class="sr-only" aria-live="polite" aria-atomic="true">
  {transactionDragAnnouncement}
</p>

<CreateTransactionDialog
  bind:open={transactionDialogOpen}
  budgetCategoryId={selectedBudgetCategory?.id}
  categoryName={selectedBudgetCategory?.category.name}
  data={createTransactionForm}
  error={createTransactionError}
  onOpenChange={(open) => (transactionDialogOpen = open)}
/>

<EditTransactionDialog
  bind:open={editDialogOpen}
  transaction={selectedTransaction}
  data={updateTransactionForm}
  error={updateTransactionError}
  onOpenChange={handleEditOpenChange}
/>

{#if deleteSelection}
  <ConfirmDialog
    open={deleteDialogOpen}
    onOpenChange={handleDeleteOpenChange}
    title={m.budget_detail_transaction_delete_title()}
    description={m.budget_detail_transaction_delete_description({
      name: deleteSelection.transaction.name,
    })}
    confirmLabel={m.budget_detail_transaction_delete_confirm()}
    cancelLabel={m.budget_detail_transaction_cancel()}
    loading={deleting}
    onConfirm={() => deleteForm?.requestSubmit()}
  />

  <form
    method="POST"
    action="?/deleteTransaction"
    bind:this={deleteForm}
    aria-hidden="true"
    class="absolute"
    use:enhance={() => {
      deleting = true
      return async ({ result, update }) => {
        deleting = false

        if (result.type === 'success') {
          const deleted = ensureDefined(deleteSelection)
          deleteDialogOpen = false
          toast.success(
            m.budget_detail_transaction_delete_success({
              name: deleted.transaction.name,
            }),
          )
          await invalidateAll()
          await tick()
          document.getElementById(deleted.focusId)?.focus()
          deleteSelection = undefined
          deleteTrigger = undefined
          return
        }

        if (result.type === 'redirect') {
          await update()
          return
        }

        toast.error(m.budget_detail_transaction_delete_error())
      }
    }}
  >
    <input
      type="hidden"
      name="transactionId"
      value={deleteSelection.transaction.id}
    />
  </form>
{/if}
