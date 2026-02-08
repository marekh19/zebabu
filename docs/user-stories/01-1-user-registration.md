# [US-1.1] User Registration

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☑ Done

---

## User Story

**As a** new user,
**I want to** register with email and password,
**So that** I can create and manage my budgets securely.

---

## Description

Implement user registration functionality using Better Auth. Users should be able to create an account with their email and password. The system should validate email format, enforce password requirements, and prevent duplicate email registrations.

---

## Acceptance Criteria

- [x] Registration form accessible at `/auth/register`
- [x] Email validation (valid format, unique)
- [x] Password requirements enforced (min 8 chars, mix of letters/numbers)
- [x] Error messages displayed for validation failures
- [x] Successful registration redirects to budget list page
- [x] User session automatically created after registration
- [ ] Primary currency defaults to CZK
- [ ] Locale defaults to cs-CZ

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/auth/register/+page.svelte` - Registration form UI
- `src/routes/auth/register/+page.server.ts` - Registration action
- `src/lib/server/modules/auth/service.ts` - User creation logic
- `src/lib/server/modules/auth/repository.ts` - Database queries
- `src/lib/server/auth.ts` - Better Auth configuration
- `src/lib/server/db/schema/users.ts` - User schema (Drizzle)

### Implementation Steps

1. **Set up Better Auth**
   - Install Better Auth package: `pnpm add better-auth`
   - Configure Better Auth in `src/lib/server/auth.ts`
   - Set up session management in `hooks.server.ts`

2. **Create User Schema**
   - Define users table in Drizzle schema
   - Fields: id, email, name, primaryCurrency, locale, createdAt, updatedAt
   - Add unique constraint on email

3. **Create Registration Page**
   - Build registration form with Superforms + Zod
   - Fields: email, password, confirm password
   - Client-side validation with error messages

4. **Implement Registration Action**
   - Validate form data with Zod schema
   - Check for existing email
   - Hash password with Better Auth
   - Create user record in database
   - Create session and redirect to `/budgets`

### Service Layer

```typescript
// src/lib/server/modules/auth/service.ts
import { hash } from 'better-auth'
import type { NewUser } from '$lib/server/db/schema/users'

export async function createUser(data: {
  email: string
  password: string
}): Promise<User> {
  // Check if email already exists
  const existing = await userRepository.findByEmail(data.email)
  if (existing) {
    throw new Error('Email already registered')
  }

  // Hash password
  const hashedPassword = await hash(data.password)

  // Create user
  const user = await userRepository.create({
    email: data.email,
    password: hashedPassword,
    primaryCurrency: 'CZK',
    locale: 'cs-CZ',
  })

  return user
}
```

### UI Components

```svelte
<!-- src/routes/auth/register/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const { form, errors, enhance } = superForm(data.form)
</script>

<form method="POST" use:enhance>
  <input
    type="email"
    name="email"
    bind:value={$form.email}
    placeholder="Email"
  />
  {#if $errors.email}<span class="error">{$errors.email}</span>{/if}

  <input
    type="password"
    name="password"
    bind:value={$form.password}
    placeholder="Password"
  />
  {#if $errors.password}<span class="error">{$errors.password}</span>{/if}

  <button type="submit">Register</button>
</form>
```

---

## Validation & Business Rules

- **Email Validation**: Must be valid email format and unique in database
- **Password Requirements**: Minimum 8 characters, must contain letters and numbers
- **No Duplicate Emails**: System prevents creating multiple accounts with same email

---

## Testing Checklist

- [ ] Unit tests for user creation service
- [ ] Unit tests for validation logic
- [ ] Integration test for registration flow
- [ ] Manual testing checklist:
  - [ ] Valid registration creates user and redirects
  - [ ] Invalid email shows error message
  - [ ] Weak password shows error message
  - [ ] Duplicate email shows error message
  - [ ] Session is created after successful registration

---

## Dependencies

- Depends on: None (first user story)
- Blocks: All other user stories (need authentication)

---

## Notes

- Consider adding email verification in post-MVP
- Rate limiting should be added to prevent abuse (5 attempts per 15 minutes per IP)
- Password strength indicator could improve UX
