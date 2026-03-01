<script lang="ts">
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import NavUser from '$lib/components/nav-user.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import * as m from '$lib/paraglide/messages'
  import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard'
  import type { ComponentProps } from 'svelte'

  type Props = ComponentProps<typeof Sidebar.Root> & {
    user: { name: string; email: string; image: string | null }
  }

  let { user, ...restProps }: Props = $props()
</script>

<Sidebar.Root variant="floating" collapsible="offcanvas" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" class="pointer-events-none">
          <div
            class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
          >
            <span class="text-sm font-bold">Z</span>
          </div>
          <span class="truncate text-lg font-semibold"
            >{m.sidebar_app_name()}</span
          >
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            isActive={page.url.pathname === resolve('/dashboard') ||
              page.url.pathname.startsWith(resolve('/dashboard') + '/')}
            tooltipContent={m.sidebar_nav_dashboard()}
          >
            {#snippet child({ props })}
              <a href={resolve('/dashboard')} {...props}>
                <LayoutDashboardIcon />
                <span>{m.sidebar_nav_dashboard()}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser {user} />
  </Sidebar.Footer>
</Sidebar.Root>
