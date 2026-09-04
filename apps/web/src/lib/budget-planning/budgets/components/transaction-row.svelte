<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check'
  import { formatDecimal } from '$lib/utils'
  import type { PlannedTransaction } from '$lib/budget-planning/model'

  type Props = {
    transaction: PlannedTransaction
    onEdit?: (transaction: PlannedTransaction) => void
  }

  let { transaction: t, onEdit }: Props = $props()

  const formattedAmount = $derived(formatDecimal(t.amount))
</script>

{#snippet content()}
  <div class="min-w-0 flex-1 text-left">
    <p class="truncate text-sm">{t.name}</p>
    {#if t.note}
      <p class="text-muted-foreground truncate text-xs">{t.note}</p>
    {/if}
  </div>
  <div class="flex shrink-0 items-center gap-1.5">
    <span class="text-sm font-medium tabular-nums">{formattedAmount}</span>
    {#if t.isPaid}
      <CheckIcon class="size-3.5 text-emerald-500" />
    {/if}
  </div>
{/snippet}

{#if onEdit}
  <button
    type="button"
    class="hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 outline-none focus-visible:ring-[3px]"
    onclick={() => onEdit(t)}
  >
    {@render content()}
  </button>
{:else}
  <div class="flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5">
    {@render content()}
  </div>
{/if}
