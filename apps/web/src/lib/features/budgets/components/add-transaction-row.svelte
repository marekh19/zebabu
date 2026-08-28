<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import PlusIcon from '@lucide/svelte/icons/plus'

  type Props = {
    categoryName: string
    onclick: () => void
  }

  let { categoryName, onclick }: Props = $props()
</script>

<button
  type="button"
  {onclick}
  aria-label={m.budget_detail_transaction_add_label({ categoryName })}
  class="text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 w-full items-center justify-center rounded-md border border-dashed transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px]"
>
  <PlusIcon class="size-7" aria-hidden="true" />
</button>
