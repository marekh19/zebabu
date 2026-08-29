<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check'
  import { formatDecimal } from '$lib/utils'
  import type { PlannedTransaction } from '$lib/budget-planning/model'

  type Props = {
    transaction: PlannedTransaction
  }

  let { transaction: t }: Props = $props()

  const formattedAmount = $derived(formatDecimal(t.amount))
</script>

<div class="flex min-h-11 items-start gap-2 rounded-md px-2 py-1.5">
  <div class="min-w-0 flex-1">
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
</div>
