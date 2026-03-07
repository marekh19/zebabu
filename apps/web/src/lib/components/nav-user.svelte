<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { authClient } from '$lib/auth/client'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import * as m from '$lib/paraglide/messages'
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down'
  import { toast } from 'svelte-sonner'
  import LogOutIcon from '@lucide/svelte/icons/log-out'

  type Props = {
    user: { name: string; email: string; image: string | null }
  }

  let { user }: Props = $props()

  let loggingOut = $state(false)

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  async function logout() {
    loggingOut = true
    await authClient.signOut()
    toast.success(m.logout_success())
    goto(resolve('/auth/login'))
  }
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            {...props}
          >
            <Avatar.Root class="size-8 rounded-lg">
              {#if user.image}
                <Avatar.Image src={user.image} alt={user.name} />
              {/if}
              <Avatar.Fallback class="rounded-lg">
                {getInitials(user.name)}
              </Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="text-muted-foreground truncate text-xs"
                >{user.email}</span
              >
            </div>
            <ChevronsUpDownIcon class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="top"
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar.Root class="size-8 rounded-lg">
              {#if user.image}
                <Avatar.Image src={user.image} alt={user.name} />
              {/if}
              <Avatar.Fallback class="rounded-lg">
                {getInitials(user.name)}
              </Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="text-muted-foreground truncate text-xs"
                >{user.email}</span
              >
            </div>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.Item onclick={logout} disabled={loggingOut}>
            <LogOutIcon />
            <span>{loggingOut ? m.logout_submitting() : m.logout_button()}</span
            >
          </DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
