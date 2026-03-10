<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus'
  import { Button } from '$lib/components/ui/button'

  type Props = {
    onclick: () => void
    ariaLabel: string
  }

  let { onclick, ariaLabel }: Props = $props()
</script>

<Button
  size="icon-xl"
  class="fixed right-6 bottom-6 z-50 rounded-full shadow-lg"
  aria-label={ariaLabel}
  {onclick}
>
  <PlusIcon class="size-6" />
</Button>
