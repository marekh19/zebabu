# [US-1.5] Set Primary Currency

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** set my primary currency,
**So that** all my budget calculations are displayed in my preferred currency.

---

## Description

Allow users to select their primary currency from a list of supported currencies (ISO 4217 codes). This currency will be used as the base for all budget calculations and display. All multi-currency transactions will be converted to this primary currency.

---

## Acceptance Criteria

- [ ] Profile settings page accessible from navigation
- [ ] Currency dropdown shows list of supported currencies
- [ ] Current primary currency pre-selected in dropdown
- [ ] Changing currency updates user profile
- [ ] Success message shown after saving
- [ ] All budget pages reflect new currency immediately
- [ ] Currency defaults to CZK for new users

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/profile/+page.svelte` - Profile settings page
- `src/routes/(app)/profile/+page.server.ts` - Load user data and update action
- `src/lib/server/modules/auth/service.ts` - Update user profile logic
- `src/lib/server/modules/auth/repository.ts` - User update queries
- `src/lib/constants/currencies.ts` - List of supported currencies

### Implementation Steps

1. **Create Currency Constants**
   - Define list of supported ISO 4217 currency codes
   - Include currency symbols and display names
   - Prioritize common currencies at top of list

2. **Create Profile Settings Page**
   - Load current user data
   - Display currency dropdown with all options
   - Use Superforms for form handling
   - Show current selection

3. **Implement Update Action**
   - Validate currency code is in supported list
   - Update user record in database
   - Revalidate session with new currency
   - Show success feedback

4. **Update Navigation**
   - Add "Profile" or "Settings" link in header
   - Ensure easy access from any page

### Service Layer

```typescript
// src/lib/server/modules/auth/service.ts
export async function updatePrimaryCurrency(
  userId: string,
  currency: string,
): Promise<User> {
  // Validate currency code
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new Error('Invalid currency code')
  }

  const user = await userRepository.update(userId, {
    primaryCurrency: currency,
    updatedAt: new Date(),
  })

  return user
}
```

```typescript
// src/lib/constants/currencies.ts
export const SUPPORTED_CURRENCIES = [
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code']
```

### UI Components

```svelte
<!-- src/routes/(app)/profile/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import { SUPPORTED_CURRENCIES } from '$lib/constants/currencies'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const { form, errors, enhance, message } = superForm(data.form)
</script>

<div class="profile-page">
  <h1>Profile Settings</h1>

  {#if $message}
    <div class="success-message">{$message}</div>
  {/if}

  <form method="POST" action="?/updateCurrency" use:enhance>
    <label>
      Primary Currency
      <select name="currency" bind:value={$form.currency}>
        {#each SUPPORTED_CURRENCIES as currency}
          <option value={currency.code}>
            {currency.code} - {currency.name} ({currency.symbol})
          </option>
        {/each}
      </select>
    </label>
    {#if $errors.currency}
      <span class="error">{$errors.currency}</span>
    {/if}

    <button type="submit">Save Changes</button>
  </form>

  <div class="info-box">
    <p>
      Your primary currency is used for all budget calculations. Transactions in
      other currencies will be automatically converted using current exchange
      rates.
    </p>
  </div>
</div>
```

```typescript
// src/routes/(app)/profile/+page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'
import { SUPPORTED_CURRENCIES } from '$lib/constants/currencies'
import type { Actions, PageServerLoad } from './$types'

const currencySchema = z.object({
  currency: z.enum(
    SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]],
  ),
})

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session?.user) {
    redirect(302, '/auth/login')
  }

  const form = await superValidate(
    { currency: locals.session.user.primaryCurrency },
    currencySchema,
  )

  return {
    user: locals.session.user,
    form,
  }
}

export const actions: Actions = {
  updateCurrency: async ({ request, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401, { message: 'Unauthorized' })

    const form = await superValidate(request, currencySchema)

    if (!form.valid) {
      return fail(400, { form })
    }

    await authService.updatePrimaryCurrency(user.id, form.data.currency)

    return { form, message: 'Primary currency updated successfully' }
  },
}
```

---

## Validation & Business Rules

- **Currency Code Validation**: Must be valid ISO 4217 code from supported list
- **Default Value**: New users default to CZK
- **Immediate Effect**: Currency change affects all budget displays immediately
- **Exchange Rates**: System fetches exchange rates for non-primary currencies

---

## Testing Checklist

- [ ] Unit tests for currency update service
- [ ] Unit tests for currency validation
- [ ] Integration test for profile update flow
- [ ] Manual testing checklist:
  - [ ] Profile page shows current primary currency
  - [ ] Dropdown includes all supported currencies
  - [ ] Selecting new currency saves successfully
  - [ ] Success message displayed after save
  - [ ] Budget pages reflect new currency immediately
  - [ ] Invalid currency code rejected by validation
  - [ ] New users have CZK as default

---

## Dependencies

- Depends on: US-1.1 (User Registration)
- Blocks: US-6.1, US-6.2, US-6.3 (Multi-currency features)

---

## Notes

- Consider adding currency symbol next to amounts throughout app
- Future: Allow users to request additional currencies to be added
- Consider adding search/filter for currency dropdown if list grows large
- Currency change doesn't convert existing transaction amounts (they remain in original currency)
