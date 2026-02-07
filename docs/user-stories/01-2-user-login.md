# [US-1.2] User Login

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** registered user,
**I want to** log in with my email and password,
**So that** I can access my budgets.

---

## Description

Implement user login functionality using Better Auth. Users should be able to authenticate with their email and password, with proper error handling for invalid credentials.

---

## Acceptance Criteria

- [ ] Login form accessible at `/auth/login`
- [ ] Email and password fields required
- [ ] Error message for invalid credentials
- [ ] Successful login creates session and redirects to `/budgets`
- [ ] "Forgot password?" link visible
- [ ] "Don't have an account?" link to registration
- [ ] Form uses progressive enhancement

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/auth/login/+page.svelte` - Login form UI
- `src/routes/auth/login/+page.server.ts` - Login action
- `src/lib/server/modules/auth/service.ts` - Authentication logic
- `src/hooks.server.ts` - Session handling

### Implementation Steps

1. **Create Login Page**
   - Build login form with Superforms + Zod
   - Email and password fields
   - Remember me checkbox (optional)

2. **Implement Login Action**
   - Validate credentials with Better Auth
   - Create session on success
   - Return error on failure
   - Redirect to /budgets on success

3. **Add Session Handling**
   - Configure session in hooks.server.ts
   - Set session data in locals
   - Handle session expiration

### UI Components

```svelte
<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const { form, errors, enhance } = superForm(data.form)
</script>

<div class="login-page">
  <h1>Login</h1>

  <form method="POST" use:enhance>
    <label>
      Email
      <input
        type="email"
        name="email"
        bind:value={$form.email}
        autocomplete="email"
        required
      />
      {#if $errors.email}<span class="error">{$errors.email}</span>{/if}
    </label>

    <label>
      Password
      <input
        type="password"
        name="password"
        bind:value={$form.password}
        autocomplete="current-password"
        required
      />
      {#if $errors.password}<span class="error">{$errors.password}</span>{/if}
    </label>

    <button type="submit">Login</button>
  </form>

  <p>
    <a href="/auth/forgot-password">Forgot password?</a>
  </p>
  <p>
    Don't have an account? <a href="/auth/register">Register</a>
  </p>
</div>
```

---

## Validation & Business Rules

- Email must be registered in system
- Password must match hashed password in database
- Rate limiting: 5 attempts per 15 minutes per IP

---

## Testing Checklist

- [ ] Unit tests for authentication service
- [ ] Integration test for login flow
- [ ] Manual testing:
  - [ ] Valid credentials create session and redirect
  - [ ] Invalid credentials show error
  - [ ] Rate limiting works after 5 failed attempts

---

## Dependencies

- Depends on: US-1.1 (User Registration)
- Blocks: All authenticated features

---

## Notes

- Consider adding "Remember me" functionality
- Consider adding social login in future (Google, GitHub)
