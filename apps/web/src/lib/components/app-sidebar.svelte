<script lang="ts">
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import NavUser from '$lib/components/nav-user.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import { sidebarRoutes } from '$lib/config/navigation'
  import * as m from '$lib/paraglide/messages'
  import type { ComponentProps } from 'svelte'

  type SidebarRoutePath = (typeof sidebarRoutes)[number]['path']

  type Props = ComponentProps<typeof Sidebar.Root> & {
    user: { name: string; email: string; image: string | null }
  }

  let { user, ...restProps }: Props = $props()

  const checkIsRouteActive = (path: SidebarRoutePath) =>
    page.url.pathname === resolve(path) ||
    page.url.pathname.startsWith(resolve(path) + '/')
</script>

<Sidebar.Root variant="floating" collapsible="offcanvas" {...restProps}>
  <Sidebar.Header>
    <div class="flex h-12 items-center gap-2 px-2">
      <div
        class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
      >
        <span class="text-sm font-bold">Z</span>
      </div>
      <span class="truncate text-lg font-semibold">{m.sidebar_app_name()}</span>
    </div>
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.Menu>
        {#each sidebarRoutes as route (route.path)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton
              isActive={checkIsRouteActive(route.path)}
              tooltipContent={route.label()}
            >
              {#snippet child({ props })}
                <a href={resolve(route.path)} {...props}>
                  <route.icon />
                  <span>{route.label()}</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser {user} />
  </Sidebar.Footer>
</Sidebar.Root>
