<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements'
  import type { Snippet } from 'svelte'
  import { cn, type WithElementRef } from '$lib/utils.js'

  let {
    ref = $bindable(null),
    class: className,
    href = undefined,
    child,
    children,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    child?: Snippet<[{ props: HTMLAnchorAttributes }]>
  } = $props()

  const attrs = $derived({
    'data-slot': 'breadcrumb-link',
    class: cn(
      'hover:text-foreground rounded-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      className,
    ),
    href,
    ...restProps,
  })
</script>

{#if child}
  {@render child({ props: attrs })}
{:else}
  <a bind:this={ref} {...attrs}>
    {@render children?.()}
  </a>
{/if}
