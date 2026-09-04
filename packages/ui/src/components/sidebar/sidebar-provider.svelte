<script lang="ts">
  import * as Tooltip from '../tooltip/index.js'
  import { cn, type WithElementRef } from '../../utils.js'
  import { onMount } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import {
    SIDEBAR_STORAGE_KEY,
    SIDEBAR_WIDTH,
    SIDEBAR_WIDTH_ICON,
  } from './constants.js'
  import { setSidebar } from './context.svelte.js'

  let {
    ref = $bindable(null),
    open = $bindable(true),
    onOpenChange = () => {},
    class: className,
    style,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  } = $props()

  const sidebar = setSidebar({
    open: () => open,
    setOpen: (value: boolean) => {
      open = value
      onOpenChange(value)

      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open))
      } catch {
        // Storage can be unavailable in privacy-restricted browsers.
      }
    },
  })

  onMount(() => {
    try {
      const storedOpen = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (storedOpen === 'true' || storedOpen === 'false') {
        open = storedOpen === 'true'
      }
    } catch {
      // Keep the default when storage is unavailable.
    }
  })
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
  <div
    data-slot="sidebar-wrapper"
    style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
    class={cn(
      'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
      className,
    )}
    bind:this={ref}
    {...restProps}
  >
    {@render children?.()}
  </div>
</Tooltip.Provider>
