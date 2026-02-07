# [US-7.2] Import Budget from CSV

**Epic:** Data Import/Export
**Priority:** P2 (Nice to Have)
**Story Points:** 3
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** import a budget from CSV,
**So that** I can quickly set up a budget from a template or previous export.

---

## Description

Allow users to upload a CSV file to create a new budget. The CSV is parsed, validated, and used to create categories and transactions. Useful for onboarding with templates or migrating from other tools.

---

## Acceptance Criteria

- [ ] Import page with file upload
- [ ] CSV format same as export
- [ ] Validation checks for required fields
- [ ] Must have at least 1 income and 1 expense category
- [ ] Creates new budget (doesn't overwrite)
- [ ] Shows preview before importing
- [ ] Error messages for invalid data
- [ ] Success message with link to new budget

---

## Technical Implementation

```typescript
// src/lib/server/modules/import-export/import.service.ts
import Papa from 'papaparse'

export async function parseAndImportCSV(
  csvContent: string,
  budgetName: string,
  budgetType: 'monthly' | 'scenario',
  userId: string,
): Promise<Budget> {
  const parsed = Papa.parse(csvContent, { header: true })

  // Validate structure
  const requiredColumns = [
    'Category',
    'Category Type',
    'Transaction',
    'Amount',
    'Currency',
  ]
  const hasAllColumns = requiredColumns.every((col) =>
    parsed.meta.fields?.includes(col),
  )

  if (!hasAllColumns) {
    throw new Error('Invalid CSV format')
  }

  // Group by category
  const categories = new Map<string, any[]>()

  for (const row of parsed.data) {
    const categoryName = row['Category']
    if (!categories.has(categoryName)) {
      categories.set(categoryName, [])
    }
    categories.get(categoryName)!.push(row)
  }

  // Validate business rules
  const hasIncome = Array.from(categories.values()).some(
    (rows) => rows[0]['Category Type'] === 'income',
  )
  const hasExpense = Array.from(categories.values()).some(
    (rows) => rows[0]['Category Type'] === 'expense',
  )

  if (!hasIncome || !hasExpense) {
    throw new Error('Budget must have at least 1 income and 1 expense category')
  }

  // Create budget
  const budget = await budgetService.createBudget(userId, {
    name: budgetName,
    type: budgetType,
  })

  // Create categories and transactions
  let categoryOrder = 0
  for (const [categoryName, rows] of categories) {
    const category = await categoryService.createCategory(budget.id, {
      name: categoryName,
      type: rows[0]['Category Type'],
      order: categoryOrder++,
    })

    let transactionOrder = 0
    for (const row of rows) {
      await transactionService.createTransaction({
        categoryId: category.id,
        title: row['Transaction'],
        amount: parseFloat(row['Amount']),
        currency: row['Currency'],
        isPaid: row['Paid'] === 'Yes',
        note: row['Note'] || null,
        order: transactionOrder++,
      })
    }
  }

  return budget
}
```

---

## Dependencies

- Depends on: US-7.1 (Export CSV), US-2.1 (Create Budget)
- Blocks: None

---
