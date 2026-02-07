# [US-1.3] User Logout

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** logged-in user,
**I want to** log out of my account,
**So that** I can secure my data when using shared devices.

---

## Description

Implement logout functionality that terminates the user's session and redirects them to the login page. This ensures users can safely end their session, especially when using shared or public computers.

---

## Acceptance Criteria

- [ ] Logout button accessible in main navigation/header
- [ ] Clicking logout terminates the session
- [ ] User redirected to `/auth/login` after logout
- [ ] Session cookie cleared/invalidated
- [ ] Attempting to access protected routes after logout redirects to login
- [ ] Success message shown after logout (optional)

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/+layout.svelte` - Add logout button in navigation
- `src/routes/(app)/+layout.server.ts` - Implement logout action
- `src/lib/server/modules/auth/service.ts` - Session termination logic
- `src/hooks.server.ts` - Handle session validation

### Implementation Steps

1. **Add Logout Action**
   - Create logout action in layout server file
   - Call Better Auth session destroy method
   - Clear session cookie
   - Redirect to login page

2. **Add UI Component**
   - Add logout button to navigation
   - Use form with POST method (not just a link)
   - Show confirmation modal (optional)
   - Disable button during submission

3. **Handle Session Cleanup**
   - Invalidate session token in database
   - Clear HTTP-only cookie
   - Update hooks to handle missing session

### Service Layer

```typescript
// src/lib/server/modules/auth/service.ts
import { auth } from '$lib/server/auth'

export async function logoutUser(sessionToken: string): Promise<void> {
  await auth.api.signOut({
    headers: {
      cookie: `auth-token=${sessionToken}`,
    },
  })
}
```

### UI Components

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { LayoutData } from './$types'

  let { data }: { data: LayoutData } = $props()
  let isLoggingOut = $state(false)
</script>

<nav>
  <div class="user-info">
    <span>{data.user.email}</span>
    <form
      method="POST"
      action="?/logout"
      use:enhance={() => {
        isLoggingOut = true
        return async ({ update }) => {
          await update()
        }
      }}
    >
      <button type="submit" disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </form>
  </div>
</nav>
```

```typescript
// src/routes/(app)/+layout.server.ts
import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  logout: async ({ locals, cookies }) => {
    if (locals.session) {
      await authService.logoutUser(locals.session.token)
      cookies.delete('auth-token', { path: '/' })
    }
    redirect(303, '/auth/login')
  },
}
```

---

## Validation & Business Rules

- Session must exist to logout (no-op if already logged out)
- Cookie cleared regardless of session state
- All redirects after logout go to login page

---

## Testing Checklist

- [ ] Unit tests for logout service
- [ ] Integration test for logout flow
- [ ] Manual testing checklist:
  - [ ] Logout button visible when logged in
  - [ ] Clicking logout redirects to login page
  - [ ] Session cookie removed after logout
  - [ ] Cannot access protected routes after logout
  - [ ] Logout works correctly in multiple tabs
  - [ ] No errors when logging out twice

---

## Dependencies

- Depends on: US-1.1 (User Registration), US-1.2 (User Login)
- Blocks: None

---

## Notes

- Consider adding "Are you sure?" confirmation modal
- Logout from all devices could be a future enhancement
- Session timeout auto-logout could be added post-MVP
