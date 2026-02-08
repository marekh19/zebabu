<script lang="ts">
  import LanguageSwitcher from '$lib/components/language-switcher.svelte'
  import ThemeSwitcher from '$lib/components/theme-switcher.svelte'
  import type { Snippet } from 'svelte'

  const { children }: { children: Snippet } = $props()
</script>

<div class="relative flex min-h-svh items-center justify-center p-4">
  <div class="absolute top-4 right-4 flex items-center gap-1">
    <ThemeSwitcher />
    <LanguageSwitcher />
  </div>
  {@render children()}
</div>
