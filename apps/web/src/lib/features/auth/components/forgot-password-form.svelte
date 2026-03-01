<script lang="ts">
  import { defaults, superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import * as m from '$lib/paraglide/messages'
  import { authClient } from '$lib/auth/client'
  import { createForgotPasswordSchema } from '$lib/features/auth/schemas/forgot-password-schema'
  import * as Card from '$lib/components/ui/card'
  import * as Form from '$lib/components/ui/form'
  import { Input } from '$lib/components/ui/input'
  import { resolve } from '$app/paths'

  let submitted = $state(false)

  const forgotPasswordSchema = createForgotPasswordSchema()

  const form = superForm(defaults(zod4(forgotPasswordSchema)), {
    SPA: true,
    validators: zod4(forgotPasswordSchema),
    async onUpdate({ form: updatedForm }) {
      if (!updatedForm.valid) return

      const redirectTo = `${window.location.origin}${resolve('/auth/reset-password')}`

      await authClient.requestPasswordReset({
        email: updatedForm.data.email,
        redirectTo,
      })

      // Always show success regardless of whether email exists
      submitted = true
    },
  })

  const { form: formData, enhance, submitting } = form
</script>

{#if submitted}
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title class="text-2xl">
        {m.forgot_password_success_title()}
      </Card.Title>
      <Card.Description>
        {m.forgot_password_success_description()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <p class="text-muted-foreground text-center text-sm">
        <a
          href={resolve('/auth/login')}
          class="text-primary underline-offset-4 hover:underline"
        >
          {m.forgot_password_back_to_login()}
        </a>
      </p>
    </Card.Content>
  </Card.Root>
{:else}
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title class="text-2xl">{m.forgot_password_title()}</Card.Title>
      <Card.Description>{m.forgot_password_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance class="space-y-4">
        <Form.Field {form} name="email">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m.forgot_password_email_label()}</Form.Label>
              <Input
                {...props}
                type="email"
                placeholder={m.forgot_password_email_placeholder()}
                bind:value={$formData.email}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Button class="w-full" disabled={$submitting}>
          {$submitting
            ? m.forgot_password_submitting()
            : m.forgot_password_submit()}
        </Form.Button>

        <p class="text-muted-foreground text-center text-sm">
          <a
            href={resolve('/auth/login')}
            class="text-primary underline-offset-4 hover:underline"
          >
            {m.forgot_password_back_to_login()}
          </a>
        </p>
      </form>
    </Card.Content>
  </Card.Root>
{/if}
