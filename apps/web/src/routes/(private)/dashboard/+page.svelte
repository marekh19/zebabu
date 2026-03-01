<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { page } from '$app/state'
</script>

<div class="flex flex-col items-start gap-4">
  <h1 class="text-3xl font-bold">{m.dashboard_title()}</h1>
  <p class="text-muted-foreground">
    {m.dashboard_greeting({ name: page.data.user.name })}
  </p>
</div>
