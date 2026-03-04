<script lang="ts">
  import { page } from '$app/state'
  import AppBreadcrumbs from '$lib/components/app-breadcrumbs.svelte'
  import AppSidebar from '$lib/components/app-sidebar.svelte'
  import LanguageSwitcher from '$lib/components/language-switcher.svelte'
  import ThemeSwitcher from '$lib/components/theme-switcher.svelte'
  import { Separator } from '$lib/components/ui/separator'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import type { Snippet } from 'svelte'

  type Props = { children: Snippet }

  let { children }: Props = $props()
</script>

<Sidebar.Provider>
  <AppSidebar user={page.data.user} />
  <Sidebar.Inset>
    <header
      class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
    >
      <div class="flex items-center gap-2 px-4">
        <Sidebar.Trigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <AppBreadcrumbs />
      </div>
      <div class="ml-auto flex items-center gap-2 px-4">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
