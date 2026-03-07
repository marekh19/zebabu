<script lang="ts">
  import { defaults, superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import * as m from '$lib/paraglide/messages'
  import { authClient } from '$lib/auth/client'
  import { getAuthError } from '$lib/features/auth/utils/auth-errors'
  import { createLoginSchema } from '$lib/features/auth/schemas/login-schema'
  import * as Card from '$lib/components/ui/card'
  import * as Form from '$lib/components/ui/form'
  import { Input } from '$lib/components/ui/input'
  import { resolve } from '$app/paths'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  let serverError = $state('')

  const loginSchema = createLoginSchema()
  const form = superForm(defaults(zod4(loginSchema)), {
    SPA: true,
    validators: zod4(loginSchema),
    async onUpdate({ form: updatedForm }) {
      if (!updatedForm.valid) return

      serverError = ''

      const { error } = await authClient.signIn.email({
        email: updatedForm.data.email,
        password: updatedForm.data.password,
      })

      if (error) {
        serverError = getAuthError(error.code ?? '')
        return
      }

      goto(resolve('/(private)/budgets'))
    },
  })

  const { form: formData, enhance, submitting } = form

  $effect(() => {
    const emailParam = page.url.searchParams.get('email')
    if (!emailParam) return

    $formData.email = emailParam

    const url = new URL(page.url)
    url.searchParams.delete('email')
    history.replaceState(history.state, '', url.toString())
  })
</script>

<Card.Root class="w-full max-w-md">
  <Card.Header>
    <Card.Title class="text-2xl">{m.login_title()}</Card.Title>
    <Card.Description>{m.login_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form method="POST" use:enhance class="space-y-4">
      {#if serverError}
        <p class="text-destructive text-sm font-medium">{serverError}</p>
      {/if}

      <Form.Field {form} name="email">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.login_email_label()}</Form.Label>
            <Input
              {...props}
              type="email"
              placeholder={m.login_email_placeholder()}
              bind:value={$formData.email}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="password">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.login_password_label()}</Form.Label>
            <Input
              {...props}
              type="password"
              placeholder={m.login_password_placeholder()}
              bind:value={$formData.password}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <p class="text-muted-foreground text-sm">
        <a
          href={resolve('/auth/forgot-password')}
          class="text-primary underline-offset-4 hover:underline"
        >
          {m.login_forgot_password()}
        </a>
      </p>

      <Form.Button class="w-full" disabled={$submitting}>
        {$submitting ? m.login_submitting() : m.login_submit()}
      </Form.Button>

      <p class="text-muted-foreground text-center text-sm">
        {m.login_signup_prompt()}
        <a
          href={resolve('/auth/signup')}
          class="text-primary underline-offset-4 hover:underline"
        >
          {m.login_signup_link()}
        </a>
      </p>
    </form>
  </Card.Content>
</Card.Root>
