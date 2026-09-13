<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { formatDecimal, formatPercentage } from '$lib/utils'
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical'
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable'
  import { useDroppable } from '@dnd-kit-svelte/svelte'
  import TransactionRow from './transaction-row.svelte'
  import AddTransactionRow from './add-transaction-row.svelte'
  import type {
    BudgetCategory,
    PlannedTransaction,
  } from '$lib/budget-planning/model'
  import { colorClasses } from '$lib/budget-planning/categories/colors'
  import { CategoryType } from '$lib/budget-planning/categories/types'
  import { getBudgetCategoryTotal } from '../totals'
  import {
    CATEGORY_DRAG_TYPE,
    getTransactionGroupId,
    TRANSACTION_COLLISION_PRIORITY,
    TRANSACTION_DRAG_TYPE,
  } from '../transaction-position'

  const CATEGORY_TYPE_LABELS = {
    [CategoryType.Income]: m.budget_detail_type_income,
    [CategoryType.Expense]: m.budget_detail_type_expense,
  } as const satisfies Record<CategoryType, () => string>

  type Props = {
    budgetCategory: BudgetCategory
    index: number
    isOverlay?: boolean
    onAddTransaction?: (budgetCategory: BudgetCategory) => void
    onEditTransaction?: (
      transaction: PlannedTransaction,
      trigger: HTMLElement,
    ) => void
    onDeleteTransaction?: (
      transaction: PlannedTransaction,
      trigger: HTMLElement,
    ) => void
    onToggleTransactionPaid?: (transaction: PlannedTransaction) => void
    paidBusyTransactionIds?: readonly string[]
    transactionDragBusy?: boolean
    transactionTargetCategoryId?: string
    onTransactionDragKeyDown?: (
      transactionId: string,
      event: KeyboardEvent,
    ) => void
  }

  let {
    budgetCategory,
    index,
    isOverlay = false,
    onAddTransaction,
    onEditTransaction,
    onToggleTransactionPaid,
    paidBusyTransactionIds = [],
    onDeleteTransaction,
    transactionDragBusy = false,
    transactionTargetCategoryId,
    onTransactionDragKeyDown,
  }: Props = $props()

  const { ref, handleRef, isDragSource } = useSortable({
    id: () => budgetCategory.id,
    index: () => index,
    type: CATEGORY_DRAG_TYPE,
    accept: CATEGORY_DRAG_TYPE,
    register: () => !isOverlay,
  })

  const transactionGroupId = $derived(getTransactionGroupId(budgetCategory.id))
  const { ref: transactionDropRef, isDropTarget } = useDroppable({
    id: () => transactionGroupId,
    type: TRANSACTION_DRAG_TYPE,
    accept: TRANSACTION_DRAG_TYPE,
    collisionPriority: TRANSACTION_COLLISION_PRIORITY.group,
    disabled: () => isOverlay || transactionDragBusy,
    register: () => !isOverlay,
  })

  const total = $derived(getBudgetCategoryTotal(budgetCategory))

  const formattedTotal = $derived(formatDecimal(total))

  const dragging = $derived(isDragSource.current && !isOverlay)
  const transactionTargeted = $derived(
    isDropTarget.current || transactionTargetCategoryId === budgetCategory.id,
  )
</script>

<div
  class="relative w-[calc(100vw-2rem)] shrink-0 snap-start snap-always sm:w-75"
  {@attach ref}
>
  <!-- Column content — invisible when dragged (keeps dimensions for layout) -->
  <div
    class="bg-background flex flex-col rounded-lg border {dragging
      ? 'invisible'
      : ''} {isOverlay ? 'ring-primary/25 shadow-xl ring-2' : ''}"
  >
    <div
      class="flex items-center gap-1 rounded-t-lg px-3 py-2.5 {colorClasses[
        budgetCategory.category.color
      ].header}"
    >
      <div
        class="text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 -ml-1.5 shrink-0 cursor-grab rounded-sm outline-none focus-visible:ring-[3px] active:cursor-grabbing"
        aria-label={m.budget_detail_reorder_handle()}
        {@attach handleRef}
      >
        <GripVerticalIcon class="size-4" />
      </div>
      <span class="min-w-0 flex-1 truncate text-sm font-semibold"
        >{budgetCategory.category.name}</span
      >
      <span
        class="shrink-0 text-xs {colorClasses[budgetCategory.category.color]
          .badge}"
      >
        {CATEGORY_TYPE_LABELS[budgetCategory.category.type]()}
      </span>
    </div>

    <div class="flex items-center justify-between gap-3 border-b px-3 py-2">
      <div class="flex flex-col gap-0.5">
        <span class="text-muted-foreground text-xs font-medium">
          {m.budget_detail_total()}
        </span>
        {#if budgetCategory.category.type === CategoryType.Expense && budgetCategory.allocationTarget !== null}
          <span
            class="text-xs font-medium {colorClasses[
              budgetCategory.category.color
            ].badge}"
          >
            {m.allocation_target_label({
              value: formatPercentage(budgetCategory.allocationTarget),
            })}
          </span>
        {/if}
      </div>
      <span class="text-sm font-bold tabular-nums">{formattedTotal}</span>
    </div>

    <div
      class="flex min-h-14 flex-1 flex-col gap-0.5 rounded-b-lg p-1.5 {transactionTargeted
        ? 'bg-primary/5 ring-primary/30 ring-2 ring-inset'
        : ''}"
      {@attach transactionDropRef}
    >
      {#if budgetCategory.transactions.length === 0}
        <p class="text-muted-foreground px-2 py-3 text-center text-xs">
          {m.budget_detail_no_transactions()}
        </p>
      {:else}
        {#each budgetCategory.transactions as t, transactionIndex (t.id)}
          <TransactionRow
            transaction={t}
            budgetCategoryId={budgetCategory.id}
            index={transactionIndex}
            dragGroupId={transactionGroupId}
            dragDisabled={transactionDragBusy}
            onDragKeyDown={onTransactionDragKeyDown}
            onEdit={onEditTransaction}
            onTogglePaid={onToggleTransactionPaid}
            isPaidBusy={paidBusyTransactionIds.includes(t.id)}
            onDelete={onDeleteTransaction}
          />
        {/each}
      {/if}

      {#if !isOverlay && onAddTransaction}
        <AddTransactionRow
          budgetCategoryId={budgetCategory.id}
          categoryName={budgetCategory.category.name}
          onclick={() => onAddTransaction(budgetCategory)}
        />
      {/if}
    </div>
  </div>

  <!-- Drop placeholder — dashed border with tinted bg -->
  {#if dragging}
    <div
      class="border-primary/40 bg-primary/5 absolute inset-0 rounded-lg border-2 border-dashed"
    ></div>
  {/if}
</div>
