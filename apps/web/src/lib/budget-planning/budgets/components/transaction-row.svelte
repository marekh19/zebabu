<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check'
  import CircleIcon from '@lucide/svelte/icons/circle'
  import * as m from '$lib/paraglide/messages'
  import { formatDecimal } from '$lib/utils'
  import type { PlannedTransaction } from '$lib/budget-planning/model'

  type Props = {
    transaction: PlannedTransaction
    onEdit?: (transaction: PlannedTransaction) => void
    onTogglePaid?: (transaction: PlannedTransaction) => void
    isPaidBusy?: boolean
  }

  let {
    transaction: t,
    onEdit,
    onTogglePaid,
    isPaidBusy = false,
  }: Props = $props()

  const formattedAmount = $derived(formatDecimal(t.amount))
</script>

{#snippet details()}
  <div class="min-w-0 flex-1 text-left">
    <p class="truncate text-sm">{t.name}</p>
    {#if t.note}
      <p class="text-muted-foreground truncate text-xs">{t.note}</p>
    {/if}
  </div>
  <span class="shrink-0 text-sm font-medium tabular-nums"
    >{formattedAmount}</span
  >
{/snippet}

{#if onEdit && onTogglePaid}
  <div
    class="group focus-within:bg-muted hover:bg-muted flex min-h-11 items-stretch rounded-md"
  >
    <button
      type="button"
      class="focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-2 rounded-md border border-transparent py-1.5 pl-2 outline-none focus-visible:ring-[3px]"
      onclick={() => onEdit(t)}
    >
      {@render details()}
    </button>
    <button
      type="button"
      role="checkbox"
      aria-checked={t.isPaid}
      aria-busy={isPaidBusy}
      aria-label={m.budget_detail_transaction_paid_toggle_label({
        transactionName: t.name,
      })}
      class="focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-transparent outline-none focus-visible:ring-[3px]"
      onclick={() => onTogglePaid(t)}
    >
      {#if t.isPaid}
        <CheckIcon class="size-4 text-emerald-500" />
      {:else}
        <CircleIcon
          class="text-muted-foreground size-4 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        />
      {/if}
    </button>
  </div>
{:else}
  <div class="flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5">
    {@render details()}
    {#if t.isPaid}
      <CheckIcon class="size-3.5 text-emerald-500" />
    {/if}
  </div>
{/if}
