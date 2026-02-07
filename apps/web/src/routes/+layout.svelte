<script lang="ts">
  // import { page } from '$app/state'
  // import { locales, localizeHref } from '$lib/paraglide/runtime'
  import './layout.css'
  import favicon from '$lib/assets/favicon.svg'
  import { ModeWatcher } from 'mode-watcher'

  let { children } = $props()
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ModeWatcher />

<div class="min-h-svh">
  {@render children()}
  <!-- {#each locales as locale (locale)} -->
  <!--   <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- localizeHref handles path resolution -->
  <!--   <a href={localizeHref(page.url.pathname, { locale })}> -->
  <!--     {locale} -->
  <!--   </a> -->
  <!-- {/each} -->
</div>
