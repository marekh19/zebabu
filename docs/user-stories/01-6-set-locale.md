# [US-1.6] Set Locale for Number Formatting

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** set my locale for number and date formatting,
**So that** amounts and dates are displayed in my preferred format.

---

## Description

Allow users to select their preferred locale (language/region) which determines how numbers, currencies, and dates are formatted throughout the application. For example, Czech locale uses "1 234,56" while US uses "1,234.56".

---

## Acceptance Criteria

- [ ] Locale dropdown available in profile settings
- [ ] Current locale pre-selected in dropdown
- [ ] Changing locale updates user profile
- [ ] All numbers formatted according to selected locale
- [ ] All dates formatted according to selected locale
- [ ] Currency symbols and formatting respect locale
- [ ] Success message shown after saving
- [ ] Locale defaults to cs-CZ for new users

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/profile/+page.svelte` - Add locale setting to profile page
- `src/routes/(app)/profile/+page.server.ts` - Update locale action
- `src/lib/server/modules/auth/service.ts` - Update user locale logic
- `src/lib/constants/locales.ts` - List of supported locales
- `src/lib/utils/formatting.ts` - Number and date formatting utilities
- `src/lib/stores/locale.ts` - Client-side locale store

### Implementation Steps

1. **Define Supported Locales**
   - Create list of supported locale codes
   - Include locale names and descriptions
   - Start with common European locales

2. **Create Formatting Utilities**
   - Create formatNumber() function using Intl.NumberFormat
   - Create formatCurrency() function using Intl.NumberFormat
   - Create formatDate() function using Intl.DateTimeFormat
   - Create formatPercentage() function

3. **Add Locale Setting to Profile**
   - Add locale dropdown to profile page
   - Save locale preference to user table
   - Update action handler

4. **Apply Locale Throughout App**
   - Use formatting utilities in all components
   - Pass user locale to formatting functions
   - Test with different locales

### Service Layer

```typescript
// src/lib/server/modules/auth/service.ts
export async function updateLocale(
  userId: string,
  locale: string,
): Promise<User> {
  // Validate locale code
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new Error('Invalid locale code')
  }

  const user = await userRepository.update(userId, {
    locale,
    updatedAt: new Date(),
  })

  return user
}
```

```typescript
// src/lib/constants/locales.ts
export const SUPPORTED_LOCALES = [
  { code: 'cs-CZ', name: 'Czech (Česko)', example: '1 234,56 Kč' },
  { code: 'en-US', name: 'English (US)', example: '$1,234.56' },
  { code: 'en-GB', name: 'English (UK)', example: '£1,234.56' },
  { code: 'de-DE', name: 'German (Deutschland)', example: '1.234,56 €' },
  { code: 'pl-PL', name: 'Polish (Polska)', example: '1 234,56 zł' },
  { code: 'sk-SK', name: 'Slovak (Slovensko)', example: '1 234,56 €' },
  { code: 'fr-FR', name: 'French (France)', example: '1 234,56 €' },
] as const

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code']
```

```typescript
// src/lib/utils/formatting.ts
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatPercentage(
  value: number,
  locale: string,
  decimals: number = 1,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

export function formatDate(
  date: Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(date)
}
```

### UI Components

```svelte
<!-- src/routes/(app)/profile/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import { SUPPORTED_CURRENCIES } from '$lib/constants/currencies'
  import { SUPPORTED_LOCALES } from '$lib/constants/locales'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const { form, errors, enhance, message } = superForm(data.form)
</script>

<div class="profile-page">
  <h1>Profile Settings</h1>

  {#if $message}
    <div class="success-message">{$message}</div>
  {/if}

  <form method="POST" use:enhance>
    <div class="form-group">
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
    </div>

    <div class="form-group">
      <label>
        Number Format (Locale)
        <select name="locale" bind:value={$form.locale}>
          {#each SUPPORTED_LOCALES as locale}
            <option value={locale.code}>
              {locale.name} - Example: {locale.example}
            </option>
          {/each}
        </select>
      </label>
      {#if $errors.locale}
        <span class="error">{$errors.locale}</span>
      {/if}
    </div>

    <button type="submit">Save Changes</button>
  </form>

  <div class="info-box">
    <h3>About Number Formatting</h3>
    <p>
      Your locale setting affects how numbers, dates, and currency amounts are
      displayed throughout the application. Choose the format you're most
      comfortable with.
    </p>
  </div>
</div>
```

```typescript
// Example usage in a budget component
<script lang="ts">
  import { formatCurrency, formatPercentage } from '$lib/utils/formatting';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const totalIncome = $derived(
    formatCurrency(
      data.budget.totalIncome,
      data.user.primaryCurrency,
      data.user.locale
    )
  );

  const allocationPercent = $derived(
    formatPercentage(
      data.budget.allocatedPercentage,
      data.user.locale
    )
  );
</script>

<div class="budget-summary">
  <div>Total Income: {totalIncome}</div>
  <div>Allocated: {allocationPercent}</div>
</div>
```

---

## Validation & Business Rules

- **Locale Code Validation**: Must be valid locale code from supported list
- **Default Value**: New users default to cs-CZ
- **Immediate Effect**: Locale change affects all number/date displays immediately
- **Formatting Consistency**: All numbers throughout app use same formatting

---

## Testing Checklist

- [ ] Unit tests for locale update service
- [ ] Unit tests for formatting utilities
- [ ] Unit tests for different locale formats
- [ ] Integration test for profile update flow
- [ ] Manual testing checklist:
  - [ ] Profile page shows current locale
  - [ ] Dropdown includes all supported locales with examples
  - [ ] Selecting new locale saves successfully
  - [ ] Success message displayed after save
  - [ ] Numbers formatted correctly for cs-CZ (1 234,56)
  - [ ] Numbers formatted correctly for en-US (1,234.56)
  - [ ] Dates formatted according to locale
  - [ ] Currency symbols display correctly
  - [ ] Invalid locale code rejected by validation

---

## Dependencies

- Depends on: US-1.1 (User Registration), US-1.5 (Set Primary Currency)
- Blocks: All features displaying numbers/dates

---

## Notes

- Intl API is well-supported in all modern browsers
- Consider adding preview of formatting in profile settings
- Future: Add full i18n/l10n for UI text translation
- Locale affects number formatting only, not UI language (for MVP)
- Test thoroughly with edge cases (very large numbers, very small numbers, negative numbers)
