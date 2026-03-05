<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { setMode, userPrefersMode } from 'mode-watcher'
  import { Button } from '$lib/components/ui/button'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import SunIcon from '@lucide/svelte/icons/sun'
  import MoonIcon from '@lucide/svelte/icons/moon'
  import MonitorIcon from '@lucide/svelte/icons/monitor'
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'
  import type { Component } from 'svelte'

  const modes = ['light', 'dark', 'system'] as const

  type Theme = (typeof modes)[number]

  const themeOptions = {
    light: { label: m.theme_light, icon: SunIcon },
    dark: { label: m.theme_dark, icon: MoonIcon },
    system: { label: m.theme_system, icon: MonitorIcon },
  } as const satisfies Record<Theme, { label: () => string; icon: Component }>

  let currentMode = $derived(userPrefersMode.current)
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button variant="ghost" size="sm" {...props}>
        <SunIcon class="inline-block size-4 dark:hidden" />
        <MoonIcon class="hidden size-4 dark:inline-block" />
        <span class="sr-only">{m.theme_label()}</span>
        <ChevronDownIcon class="size-3 opacity-50" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.RadioGroup bind:value={currentMode}>
      {#each modes as mode (mode)}
        {@const Icon = themeOptions[mode].icon}
        <DropdownMenu.RadioItem value={mode} onSelect={() => setMode(mode)}>
          <Icon class="size-4" />
          <span>{themeOptions[mode].label()}</span>
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
