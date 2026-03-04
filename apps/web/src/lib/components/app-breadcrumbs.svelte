<script lang="ts">
  import { page } from '$app/state'
  import * as Breadcrumb from '$lib/components/ui/breadcrumb'
  import { buildBreadcrumbs } from '$lib/config/breadcrumbs'

  const breadcrumbs = $derived(
    buildBreadcrumbs(page.url.pathname, page.data.breadcrumbSegments ?? {}),
  )
</script>

<Breadcrumb.Root>
  <Breadcrumb.List>
    {#each breadcrumbs as crumb, i (i)}
      <Breadcrumb.Item>
        {#if crumb.isLast}
          <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
        {:else}
          <Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
        {/if}
      </Breadcrumb.Item>
      {#if !crumb.isLast}
        <Breadcrumb.Separator />
      {/if}
    {/each}
  </Breadcrumb.List>
</Breadcrumb.Root>
