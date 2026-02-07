# [US-7.1] Export Budget to CSV

**Epic:** Data Import/Export
**Priority:** P2 (Nice to Have)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** export my budget to CSV,
**So that** I can analyze it in Excel or back it up.

---

## Description

Allow users to download their budget as a CSV file containing all categories and transactions. Useful for backup, analysis in spreadsheet software, or sharing with others.

---

## Acceptance Criteria

- [ ] Export button on budget detail page
- [ ] CSV contains all categories and transactions
- [ ] CSV format: Category, CategoryType, TransactionTitle, Amount, Currency, IsPaid, Note
- [ ] File named: `budget-{budgetName}-{date}.csv`
- [ ] Download starts immediately
- [ ] All data included (no truncation)

---

## Technical Implementation

```typescript
// src/lib/server/modules/import-export/export.service.ts
export function budgetToCSV(budget: Budget): string {
  const rows = [
    [
      'Category',
      'Category Type',
      'Transaction',
      'Amount',
      'Currency',
      'Paid',
      'Note',
    ],
  ]

  for (const category of budget.categories) {
    for (const transaction of category.transactions) {
      rows.push([
        category.name,
        category.type,
        transaction.title,
        transaction.amount.toString(),
        transaction.currency,
        transaction.isPaid ? 'Yes' : 'No',
        transaction.note || '',
      ])
    }
  }

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}
```

```typescript
// src/routes/(app)/budgets/[id]/export/+server.ts
import { budgetToCSV } from '$lib/server/modules/import-export/export.service'

export async function GET({ params, locals }) {
  const user = locals.session?.user
  if (!user) error(401)

  const budget = await budgetService.getBudgetWithDetails(params.id, user.id)
  if (!budget) error(404)

  const csv = budgetToCSV(budget)
  const filename = `budget-${budget.name}-${new Date().toISOString().split('T')[0]}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

---

## Dependencies

- Depends on: US-2.4 (View Budget Details)
- Blocks: None

---
