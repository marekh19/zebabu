<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import PlusIcon from '@lucide/svelte/icons/plus'

  type Props = {
    budgetCategoryId: string
    categoryName: string
    onclick: () => void
  }

  let { budgetCategoryId, categoryName, onclick }: Props = $props()
</script>

<a
  href={resolve(
    `/budgets/${page.params.id}?createTransactionCategory=${encodeURIComponent(budgetCategoryId)}`,
  )}
  onclick={(event) => {
    event.preventDefault()
    onclick()
  }}
  aria-label={m.budget_detail_transaction_add_label({ categoryName })}
  class="text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 w-full items-center justify-center rounded-md border border-dashed transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px]"
>
  <PlusIcon class="size-7" aria-hidden="true" />
</a>
