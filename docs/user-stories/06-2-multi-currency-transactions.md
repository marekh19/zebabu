# [US-6.2] Add Transactions in Different Currencies

**Epic:** Multi-Currency Support
**Priority:** P1 (Important)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** add transactions in different currencies,
**So that** I can track expenses and income in the currencies they actually occur in.

---

## Description

Allow users to select any supported currency when creating transactions. The transaction amount is stored in the original currency, and conversion to primary currency happens at display time using exchange rates.

---

## Acceptance Criteria

- [ ] Currency dropdown in transaction creation form
- [ ] Shows all supported currencies (same list as primary currency)
- [ ] Defaults to user's primary currency
- [ ] Transaction stored with original currency
- [ ] Can change currency when editing transaction
- [ ] Validation ensures valid ISO 4217 code

---

## Current-State Alignment

US-4.1 intentionally shipped without transaction currency because neither the user nor transaction model supported it. This story must add the currency field to the transaction model and the existing create and edit flows. Existing transactions should be migrated to the owner's primary currency.

---

## Dependencies

- Depends on: US-4.1 (Create Transaction), US-1.5 (Set Primary Currency)
- Blocks: US-6.3 (Currency Conversion)

---
