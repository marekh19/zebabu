# [US-6.4] Show Original Amount and Currency

**Epic:** Multi-Currency Support
**Priority:** P1 (Important)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see both the original and converted amounts,
**So that** I maintain transparency about my actual spending.

---

## Description

When a transaction is in a different currency than the primary currency, display both the original amount with its currency and the converted amount in parentheses or secondary text.

---

## Acceptance Criteria

- [ ] Original amount and currency always visible
- [ ] Converted amount shown in parentheses if different currency
- [ ] Format: "5,000 CZK (208.50 EUR)" when EUR is primary
- [ ] Tooltip shows exchange rate and date
- [ ] Clear visual hierarchy (original prominent, converted secondary)

---

## Technical Implementation

```svelte
<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatting'
  import type { Transaction, User } from '$lib/server/db/schema'

  let {
    transaction,
    user,
    exchangeRate,
  }: {
    transaction: Transaction
    user: User
    exchangeRate?: ExchangeRate
  } = $props()

  const showConversion = $derived(transaction.currency !== user.primaryCurrency)

  const convertedAmount = $derived(
    showConversion && exchangeRate
      ? Number(transaction.amount) * Number(exchangeRate.rate)
      : Number(transaction.amount),
  )
</script>

<div class="transaction-amount">
  <span class="original">
    {formatCurrency(
      Number(transaction.amount),
      transaction.currency,
      user.locale,
    )}
  </span>

  {#if showConversion}
    <span
      class="converted"
      title="Rate: {exchangeRate?.rate} on {exchangeRate?.date}"
    >
      ({formatCurrency(convertedAmount, user.primaryCurrency, user.locale)})
    </span>
  {/if}
</div>

<style>
  .original {
    font-weight: 600;
    font-size: 16px;
  }

  .converted {
    font-size: 14px;
    color: #6b7280;
    margin-left: 4px;
  }
</style>
```

---

## Dependencies

- Depends on: US-6.3 (Currency Conversion)
- Blocks: None

---
