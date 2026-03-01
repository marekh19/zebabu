<script lang="ts">
  import { page } from '$app/state'
  import AppSidebar from '$lib/components/app-sidebar.svelte'
  import LanguageSwitcher from '$lib/components/language-switcher.svelte'
  import ThemeSwitcher from '$lib/components/theme-switcher.svelte'
  import * as Breadcrumb from '$lib/components/ui/breadcrumb'
  import { Separator } from '$lib/components/ui/separator'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { sidebarRoutes } from '$lib/config/navigation'
  import type { Snippet } from 'svelte'

  type Props = { children: Snippet }

  let { children }: Props = $props()

  const segmentLabels = Object.fromEntries(
    sidebarRoutes.map((route) => [route.segment, route.label]),
  )

  const breadcrumbs = $derived.by(() => {
    const pathname = page.url.pathname
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((segment) => ({
      label: segmentLabels[segment]?.() ?? segment,
      isLast: segment === segments[segments.length - 1],
    }))
  })
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
        <Breadcrumb.Root>
          <Breadcrumb.List>
            {#each breadcrumbs as crumb, i (i)}
              <Breadcrumb.Item>
                {#if crumb.isLast}
                  <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
                {:else}
                  <Breadcrumb.Link>{crumb.label}</Breadcrumb.Link>
                {/if}
              </Breadcrumb.Item>
              {#if !crumb.isLast}
                <Breadcrumb.Separator />
              {/if}
            {/each}
          </Breadcrumb.List>
        </Breadcrumb.Root>
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
