<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { formatDecimal } from '$lib/utils'
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical'
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable'
  import TransactionRow from './transaction-row.svelte'
  import type { BudgetCategory } from '../types'
  import { colorClasses } from '$lib/features/categories/colors'

  type Props = {
    budgetCategory: BudgetCategory
    index: number
    isOverlay?: boolean
  }

  let { budgetCategory, index, isOverlay = false }: Props = $props()

  const { ref, handleRef, isDragSource } = useSortable({
    id: () => budgetCategory.id,
    index: () => index,
  })

  const total = $derived(
    budgetCategory.transactions.reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const formattedTotal = $derived(formatDecimal(total))

  const dragging = $derived(isDragSource.current && !isOverlay)
</script>

<div class="relative w-70 shrink-0" {@attach ref}>
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
        {budgetCategory.category.type === 'income'
          ? m.budget_detail_type_income()
          : m.budget_detail_type_expense()}
      </span>
    </div>

    <div class="flex items-center justify-between border-b px-3 py-2">
      <span class="text-muted-foreground text-xs font-medium">
        {m.budget_detail_total()}
      </span>
      <span class="text-sm font-bold tabular-nums">{formattedTotal}</span>
    </div>

    <div class="flex flex-1 flex-col gap-0.5 p-1.5">
      {#if budgetCategory.transactions.length === 0}
        <p class="text-muted-foreground px-2 py-3 text-center text-xs">
          {m.budget_detail_no_transactions()}
        </p>
      {:else}
        {#each budgetCategory.transactions as t (t.id)}
          <TransactionRow transaction={t} />
        {/each}
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
