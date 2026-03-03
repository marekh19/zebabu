<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus'
  import * as m from '$lib/paraglide/messages'
  import { Button } from '$lib/components/ui/button'

  type Props = {
    onclick: () => void
  }

  let { onclick }: Props = $props()
</script>

<Button
  size="icon-lg"
  class="fixed right-6 bottom-6 z-50 rounded-full shadow-lg"
  aria-label={m.budgets_create_fab_label()}
  {onclick}
>
  <PlusIcon class="size-5" />
</Button>
