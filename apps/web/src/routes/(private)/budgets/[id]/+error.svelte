<script lang="ts">
  import { page } from '$app/stores'
  import { resolve } from '$app/paths'
  import * as m from '$lib/paraglide/messages'
  import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert'
  import FileQuestionIcon from '@lucide/svelte/icons/file-question'
</script>

<div class="flex flex-1 items-center justify-center">
  <div class="flex flex-col items-center gap-4 text-center">
    {#if $page.status === 403}
      <ShieldAlertIcon class="text-muted-foreground size-12" />
      <h1 class="text-2xl font-bold">
        {m.budget_detail_access_denied_title()}
      </h1>
      <p class="text-muted-foreground max-w-sm">
        {m.budget_detail_access_denied_description()}
      </p>
    {:else}
      <FileQuestionIcon class="text-muted-foreground size-12" />
      <h1 class="text-2xl font-bold">
        {m.budget_detail_not_found_title()}
      </h1>
      <p class="text-muted-foreground max-w-sm">
        {m.budget_detail_not_found_description()}
      </p>
    {/if}
    <a
      href={resolve('/budgets')}
      class="text-primary mt-2 text-sm underline underline-offset-4 hover:opacity-80"
    >
      {m.budget_detail_back()}
    </a>
  </div>
</div>
