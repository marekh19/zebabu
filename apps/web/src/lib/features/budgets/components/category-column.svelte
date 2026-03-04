<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { formatDecimal } from '$lib/utils'
  import TransactionRow from './transaction-row.svelte'
  import type {
    category as categoryTable,
    transaction as transactionTable,
  } from '$lib/server/db/schema'

  type Category = typeof categoryTable.$inferSelect & {
    transactions: (typeof transactionTable.$inferSelect)[]
  }

  type Props = {
    category: Category
  }

  let { category }: Props = $props()

  const total = $derived(
    category.transactions.reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const formattedTotal = $derived(formatDecimal(total))

  const isIncome = $derived(category.type === 'income')
</script>

<div class="flex w-70 shrink-0 flex-col rounded-lg border">
  <div
    class="flex items-center justify-between rounded-t-lg px-3 py-2.5 {isIncome
      ? 'bg-emerald-500/10'
      : 'bg-muted'}"
  >
    <span class="truncate text-sm font-semibold">{category.name}</span>
    <span
      class="text-xs {isIncome
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-muted-foreground'}"
    >
      {isIncome
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
    {#if category.transactions.length === 0}
      <p class="text-muted-foreground px-2 py-3 text-center text-xs">
        {m.budget_detail_no_transactions()}
      </p>
    {:else}
      {#each category.transactions as t (t.id)}
        <TransactionRow transaction={t} />
      {/each}
    {/if}
  </div>
</div>
