<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { authClient } from '$lib/auth/client'
  import * as Card from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { resolve } from '$app/paths'

  type Props = {
    email: string
    callbackURL: string
  }

  const RESEND_COOLDOWN = 60

  const { email, callbackURL }: Props = $props()

  let resendCooldown = $state(0)
  let resendSuccess = $state(false)
  let cooldownInterval: ReturnType<typeof setInterval> | undefined

  function startCooldown() {
    resendCooldown = RESEND_COOLDOWN
    clearInterval(cooldownInterval)
    cooldownInterval = setInterval(() => {
      resendCooldown -= 1
      if (resendCooldown <= 0) {
        clearInterval(cooldownInterval)
      }
    }, 1000)
  }

  async function handleResend() {
    if (resendCooldown > 0) return

    resendSuccess = false
    await authClient.sendVerificationEmail({
      email,
      callbackURL,
    })
    resendSuccess = true
    startCooldown()
  }
</script>

<Card.Root class="w-full max-w-md">
  <Card.Header>
    <Card.Title class="text-2xl">{m.verify_email_title()}</Card.Title>
    <Card.Description>
      {m.verify_email_description({ email })}
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    {#if resendSuccess}
      <p class="text-sm font-medium text-green-600">
        {m.verify_email_resend_success()}
      </p>
    {/if}

    <Button
      class="w-full"
      variant="outline"
      disabled={resendCooldown > 0}
      onclick={handleResend}
    >
      {#if resendCooldown > 0}
        {m.verify_email_resend_cooldown({ seconds: String(resendCooldown) })}
      {:else}
        {m.verify_email_resend()}
      {/if}
    </Button>

    <p class="text-muted-foreground text-center text-sm">
      <a
        href={resolve('/auth/login')}
        class="text-primary underline-offset-4 hover:underline"
      >
        {m.verify_email_login_link()}
      </a>
    </p>
  </Card.Content>
</Card.Root>
