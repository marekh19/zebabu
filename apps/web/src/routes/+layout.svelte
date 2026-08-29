<script lang="ts">
  import '@zebabu/ui/styles.css'
  import favicon from '$lib/assets/favicon.svg'
  import { Toaster } from '@zebabu/ui/sonner'
  import { ModeWatcher } from 'mode-watcher'

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Zebabu</title>
</svelte:head>

<ModeWatcher />
<Toaster position="top-center" />

<div class="min-h-svh">
  {@render children()}
</div>
