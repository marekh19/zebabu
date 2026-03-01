<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { authClient } from '$lib/auth/client'
  import { Button } from '$lib/components/ui/button'
  import * as m from '$lib/paraglide/messages'
  import { page } from '$app/state'

  let loggingOut = $state(false)

  async function logout() {
    loggingOut = true
    await authClient.signOut()
    goto(resolve('/auth/login'))
  }
</script>

<div class="flex flex-col items-start gap-4 p-6">
  <h1 class="text-3xl font-bold">{m.dashboard_title()}</h1>
  <p class="text-muted-foreground">
    {m.dashboard_greeting({ name: page.data.user.name })}
  </p>
  <Button onclick={logout} variant="outline" disabled={loggingOut}>
    {loggingOut ? m.logout_submitting() : m.logout_button()}
  </Button>
</div>
