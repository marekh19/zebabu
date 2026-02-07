---
up: '[[Budget Planner]]'
date: 2026-01-20
---

# Budget Planner - Technical Specification Document

**Version:** 1.0  
**Date:** January 20, 2026  
**Author:** Technical Team  
**Status:** Approved for Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Domain Model](#3-domain-model)
4. [Database Schema](#4-database-schema)
5. [Business Rules & Invariants](#5-business-rules--invariants)
6. [Architecture & Technology Stack](#6-architecture--technology-stack)
7. [Module Structure](#7-module-structure)
8. [API Specifications](#8-api-specifications)
9. [Epic Breakdown](#9-epic-breakdown)
10. [User Stories](#10-user-stories)
11. [Data Flow & Calculations](#11-data-flow--calculations)
12. [Security Considerations](#12-security-considerations)
13. [Performance Requirements](#13-performance-requirements)
14. [Future Enhancements](#14-future-enhancements)

---

## 1. Executive Summary

Budget Planner is a zero-based budgeting application that helps users allocate every unit of their income to specific expense categories. The application provides a Trello-like interface where users create budgets (monthly or scenario-based), organize transactions into categories, and track their spending allocation in real-time.

**Core Value Proposition:**

- Zero-based budgeting methodology (allocate 100% of income)
- Visual Trello-like interface for budget management
- Multi-currency support with automatic conversion
- Historical budget tracking for financial insights
- Simple duplication for month-to-month planning

**Target MVP Timeline:** 8-12 weeks  
**Primary User:** Individual budget planners (single-user, no collaboration in MVP)

---

## 2. Product Overview

### 2.1 Core Concepts

**Zero-Based Budgeting** Every unit of currency earned must be assigned to a category (income gets "spent" on expenses, savings, investments, debt). The goal is to reach exactly 0 unallocated funds.

**Budget Types**

1. **Monthly Budget**: Tied to a specific month/year (e.g., "January 2026"). One per month per user. Used for historical tracking and statistics.
2. **Scenario Budget**: Named budget for planning scenarios (e.g., "If I get promoted"). Not tied to any time period. Unlimited per user.

**Category System** Users organize transactions into categories (e.g., "Living Expenses", "Investments", "Debt"). Each category has:

- Type: Income or Expense
- Optional target allocation percentage
- Color and icon for visual distinction
- Drag-and-drop ordering

**Transactions** Individual line items within categories representing planned allocations (e.g., "Rent: 10,000 CZK", "Salary: 50,000 CZK"). Transactions can be marked as paid/unpaid and support multiple currencies.

### 2.2 User Workflow

1. User creates a new monthly budget (e.g., "February 2026")
2. System creates default Income and Expense categories
3. User adds/renames categories (e.g., "Salary", "Groceries", "Savings")
4. User adds transactions to categories with amounts
5. System shows real-time calculations:
   - Total income
   - Total expenses
   - Balance (income - expenses)
   - Allocation percentage
6. User adjusts until balance = 0 (fully allocated)
7. User marks transactions as paid throughout the month
8. Next month: duplicate previous budget and adjust

### 2.3 Key Features (MVP Scope)

✅ Monthly and scenario budget creation  
✅ Category management (CRUD, drag & drop, color/icon)  
✅ Transaction management (CRUD, drag & drop between categories)  
✅ Multi-currency support with exchange rate conversion  
✅ Real-time budget calculations and validation warnings  
✅ Budget duplication  
✅ CSV import/export  
✅ User authentication and profile management

❌ **Out of Scope for MVP:**

- Multi-user/household budgets
- Budget sharing/collaboration
- Advanced reporting/analytics
- Recurring transaction templates
- Mobile apps (responsive web only)
- Bank account integration

---

## 3. Domain Model

### 3.1 Core Entities

#### User

**Description:** Represents a registered user of the application.

**Properties:**

- `id`: UUID (Primary Key)
- `email`: String (Unique, required)
- `name`: String (optional)
- `primaryCurrency`: String (ISO 4217 code, default: "CZK")
- `locale`: String (e.g., "cs-CZ", default: "cs-CZ")
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships:**

- Has many Budgets (1:N)

**Business Rules:**

- Email must be unique
- Primary currency must be valid ISO 4217 code
- Locale affects number/date formatting

---

#### Budget

**Description:** Represents a budget plan (monthly or scenario).

**Properties:**

- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key → User)
- `name`: String (required)
- `type`: Enum ("monthly" | "scenario")
- `month`: Integer (1-12, nullable for scenarios)
- `year`: Integer (nullable for scenarios)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships:**

- Belongs to User (N:1)
- Has many Categories (1:N, cascade delete)

**Business Rules:**

- Monthly budgets: `month` and `year` must be set
- Scenario budgets: `month` and `year` must be null
- One monthly budget per user per month/year (unique constraint)
- Unlimited scenario budgets per user
- Name is required (auto-generated for monthly: "January 2026")
- Deleting a budget cascades to all categories and transactions

**Derived Properties (Calculated):**

- `totalIncome`: Sum of all transactions in income categories
- `totalExpenses`: Sum of all transactions in expense categories
- `balance`: totalIncome - totalExpenses
- `allocatedPercentage`: (totalExpenses / totalIncome) × 100
- `unallocatedAmount`: balance (if positive)

---

#### Category

**Description:** Represents a grouping of transactions within a budget (e.g., "Groceries", "Salary").

**Properties:**

- `id`: UUID (Primary Key)
- `budgetId`: UUID (Foreign Key → Budget)
- `name`: String (required)
- `type`: Enum ("income" | "expense")
- `color`: String (hex color, optional)
- `icon`: String (icon name/emoji, optional)
- `order`: Integer (for drag & drop, default: 0)
- `targetPercentage`: Decimal (0-100, optional)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships:**

- Belongs to Budget (N:1)
- Has many Transactions (1:N, cascade delete)

**Business Rules:**

- Budget must have at least 1 income category (cannot delete last one)
- Budget must have at least 1 expense category (cannot delete last one)
- Type must be either "income" or "expense"
- Target percentage must be between 0-100 (if set)
- Order determines display position (managed by drag & drop)
- Deleting a category cascades to all transactions

**Derived Properties (Calculated):**

- `total`: Sum of all transaction amounts in this category
- `actualPercentage`: (total / budget.totalIncome) × 100
- `variance`: targetPercentage - actualPercentage (if target set)
- `transactionCount`: Number of transactions
- `paidCount`: Number of transactions with isPaid = true

---

#### Transaction

**Description:** Represents a single line item within a category (e.g., "Rent: 10,000 CZK").

**Properties:**

- `id`: UUID (Primary Key)
- `categoryId`: UUID (Foreign Key → Category)
- `title`: String (required)
- `amount`: Decimal (15,2) (required, must be > 0)
- `currency`: String (ISO 4217 code, required)
- `isPaid`: Boolean (default: false)
- `note`: Text (optional)
- `order`: Integer (for drag & drop, default: 0)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships:**

- Belongs to Category (N:1)

**Business Rules:**

- Amount must be positive (> 0)
- Currency must be valid ISO 4217 code
- Order determines display position within category
- Moving transaction between categories updates `categoryId` and `order`

**Derived Properties (For Display):**

- `amountInBaseCurrency`: Amount converted to user's primary currency using exchange rate

---

#### ExchangeRate

**Description:** Stores cached exchange rates for currency conversion.

**Properties:**

- `id`: UUID (Primary Key)
- `fromCurrency`: String (ISO 4217 code)
- `toCurrency`: String (ISO 4217 code)
- `rate`: Decimal (10,6)
- `date`: Date (rate validity date)
- `createdAt`: Timestamp

**Relationships:**

- None (standalone reference data)

**Business Rules:**

- Unique constraint on (fromCurrency, toCurrency, date)
- Rates are fetched from external API and cached
- Rates older than 24 hours should be refreshed
- If no rate available, use 1:1 or show error

---

### 3.2 Value Objects

#### Money

**Description:** Represents an amount in a specific currency.

**Structure:**

```typescript
type Money = {
  amount: number
  currency: string // ISO 4217
}
```

**Operations:**

- `convertTo(targetCurrency, rate)`: Convert to another currency
- `add(other)`: Add two money values (must be same currency)
- `subtract(other)`: Subtract two money values

---

#### BudgetType

**Description:** Enum for budget types.

```typescript
type BudgetType = 'monthly' | 'scenario'
```

---

#### CategoryType

**Description:** Enum for category types.

```typescript
type CategoryType = 'income' | 'expense'
```

---

### 3.3 Aggregates

**Budget Aggregate Root**

```
Budget (Root)
  ├── Category[]
  │     └── Transaction[]
```

**Aggregate Boundary:**

- Budget is the aggregate root
- Categories and Transactions are only accessed through Budget
- All consistency rules are enforced at the Budget level
- Deleting Budget removes all child entities

**Why This Design:**

- Categories cannot exist without a Budget
- Transactions cannot exist without a Category
- Business rules span all three entities (e.g., "must have ≥1 income category")
- Simplifies transaction management (single aggregate = single transaction boundary)

---

## 4. Database Schema

### 4.1 Schema Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email           │◄────────┐
│ name            │         │
│ primary_currency│         │
│ locale          │         │
│ created_at      │         │
│ updated_at      │         │
└─────────────────┘         │
                            │
                            │ user_id (FK)
                            │
┌─────────────────┐         │
│    budgets      │         │
├─────────────────┤         │
│ id (PK)         │◄────────┘
│ user_id (FK)    │
│ name            │◄────────┐
│ type            │         │
│ month           │         │
│ year            │         │
│ created_at      │         │
│ updated_at      │         │
└─────────────────┘         │
  UNIQUE(user_id,           │
         month, year)       │
                            │ budget_id (FK)
                            │
┌─────────────────┐         │
│   categories    │         │
├─────────────────┤         │
│ id (PK)         │◄────────┘
│ budget_id (FK)  │
│ name            │◄────────┐
│ type            │         │
│ color           │         │
│ icon            │         │
│ order           │         │
│ target_percent  │         │
│ created_at      │         │
│ updated_at      │         │
└─────────────────┘         │
                            │ category_id (FK)
                            │
┌─────────────────┐         │
│  transactions   │         │
├─────────────────┤         │
│ id (PK)         │◄────────┘
│ category_id (FK)│
│ title           │
│ amount          │
│ currency        │
│ is_paid         │
│ note            │
│ order           │
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐
│ exchange_rates  │  (Independent table)
├─────────────────┤
│ id (PK)         │
│ from_currency   │
│ to_currency     │
│ rate            │
│ date            │
│ created_at      │
└─────────────────┘
  UNIQUE(from_currency,
         to_currency,
         date)
```

---

### 4.2 Drizzle Schema Definition

```typescript
// schema/users.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  primaryCurrency: text('primary_currency').notNull().default('CZK'),
  locale: text('locale').notNull().default('cs-CZ'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

```typescript
// schema/budgets.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type', { enum: ['monthly', 'scenario'] }).notNull(),
    month: integer('month'), // 1-12, null for scenarios
    year: integer('year'), // null for scenarios
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueMonthlyBudget: unique('unique_monthly_budget').on(
      table.userId,
      table.month,
      table.year,
    ),
  }),
)

export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
```

```typescript
// schema/categories.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
} from 'drizzle-orm/pg-core'
import { budgets } from './budgets'

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id')
    .notNull()
    .references(() => budgets.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color'), // hex color
  icon: text('icon'), // icon name or emoji
  order: integer('order').notNull().default(0),
  targetPercentage: numeric('target_percentage', { precision: 5, scale: 2 }), // 0-100
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
```

```typescript
// schema/transactions.ts
import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'
import { categories } from './categories'

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull(), // ISO 4217
  isPaid: boolean('is_paid').notNull().default(false),
  note: text('note'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
```

```typescript
// schema/exchange-rates.ts
import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const exchangeRates = pgTable(
  'exchange_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromCurrency: text('from_currency').notNull(),
    toCurrency: text('to_currency').notNull(),
    rate: numeric('rate', { precision: 10, scale: 6 }).notNull(),
    date: date('date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueRate: unique('unique_exchange_rate').on(
      table.fromCurrency,
      table.toCurrency,
      table.date,
    ),
  }),
)

export type ExchangeRate = typeof exchangeRates.$inferSelect
export type NewExchangeRate = typeof exchangeRates.$inferInsert
```

---

### 4.3 Indexes

**Performance Optimization Indexes:**

```sql
-- Budgets
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_type ON budgets(type);
CREATE INDEX idx_budgets_month_year ON budgets(month, year);

-- Categories
CREATE INDEX idx_categories_budget_id ON categories(budget_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_order ON categories(budget_id, order);

-- Transactions
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_is_paid ON transactions(is_paid);
CREATE INDEX idx_transactions_order ON transactions(category_id, order);

-- Exchange Rates
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(date DESC);
```

---

### 4.4 Migrations Strategy

**Tool:** Drizzle Kit

**Migration Flow:**

1. Define schema changes in TypeScript
2. Generate migration: `drizzle-kit generate`
3. Review generated SQL (PostgreSQL)
4. Apply migration: `drizzle-kit push` (development) or run via deployment script (production)

**Initial Migration (0000_initial):**

- Create all tables
- Add foreign key constraints
- Add unique constraints
- Create indexes

**Database Connection:**

- Connection string format: `postgresql://user:password@host:port/database`
- Use environment variable: `DATABASE_URL`
- Connection pooling recommended for production (via Drizzle's connection pool or platform-provided pooling)

---

## 5. Business Rules & Invariants

### 5.1 Budget-Level Rules

| ID   | Rule                                                 | Enforcement                      | Error Type               |
| ---- | ---------------------------------------------------- | -------------------------------- | ------------------------ |
| BR-1 | User can only have one monthly budget per month/year | Database (UNIQUE constraint)     | DUPLICATE_MONTHLY_BUDGET |
| BR-2 | User can have unlimited scenario budgets             | No constraint                    | N/A                      |
| BR-3 | Budget must have at least 1 income category          | Application layer                | MISSING_INCOME_CATEGORY  |
| BR-4 | Budget must have at least 1 expense category         | Application layer                | MISSING_EXPENSE_CATEGORY |
| BR-5 | Monthly budget must have month and year set          | Database (NOT NULL) + Validation | INVALID_MONTHLY_BUDGET   |
| BR-6 | Scenario budget must NOT have month/year             | Validation                       | INVALID_SCENARIO_BUDGET  |
| BR-7 | Budget name is required                              | Database (NOT NULL)              | MISSING_BUDGET_NAME      |

**Warnings (Non-Blocking):**

- **W-1**: Total expenses > total income → "You're over budget by {amount}"
- **W-2**: Balance != 0 → "You have {amount} unallocated" or "You're {amount} over-allocated"
- **W-3**: Allocated percentage < 100% → "Only {percentage}% of income allocated"

---

### 5.2 Category-Level Rules

| ID    | Rule                                            | Enforcement         | Error Type                          |
| ----- | ----------------------------------------------- | ------------------- | ----------------------------------- |
| BR-8  | Cannot delete last income category in a budget  | Application layer   | CANNOT_DELETE_LAST_INCOME_CATEGORY  |
| BR-9  | Cannot delete last expense category in a budget | Application layer   | CANNOT_DELETE_LAST_EXPENSE_CATEGORY |
| BR-10 | Category type must be 'income' or 'expense'     | Database (ENUM)     | INVALID_CATEGORY_TYPE               |
| BR-11 | Target percentage must be 0-100 (if set)        | Validation          | INVALID_TARGET_PERCENTAGE           |
| BR-12 | Category order must be non-negative             | Validation          | INVALID_ORDER                       |
| BR-13 | Category name is required                       | Database (NOT NULL) | MISSING_CATEGORY_NAME               |

---

### 5.3 Transaction-Level Rules

| ID    | Rule                                   | Enforcement         | Error Type       |
| ----- | -------------------------------------- | ------------------- | ---------------- |
| BR-14 | Amount must be positive (> 0)          | Validation          | INVALID_AMOUNT   |
| BR-15 | Currency must be valid ISO 4217 code   | Validation          | INVALID_CURRENCY |
| BR-16 | Title is required                      | Database (NOT NULL) | MISSING_TITLE    |
| BR-17 | Transaction order must be non-negative | Validation          | INVALID_ORDER    |

---

### 5.4 Multi-Currency Rules

| ID    | Rule                                                              | Enforcement       | Error Type              |
| ----- | ----------------------------------------------------------------- | ----------------- | ----------------------- |
| BR-18 | All amounts converted to user's primary currency for calculations | Application layer | N/A                     |
| BR-19 | Exchange rates must be fetched for non-base currencies            | Application layer | EXCHANGE_RATE_NOT_FOUND |
| BR-20 | Exchange rates older than 24 hours should be refreshed            | Background job    | N/A                     |
| BR-21 | If exchange rate unavailable, use 1:1 ratio and show warning      | Application layer | MISSING_EXCHANGE_RATE   |

---

### 5.5 Data Integrity Rules

| ID    | Rule                                                    | Enforcement                       | Error Type   |
| ----- | ------------------------------------------------------- | --------------------------------- | ------------ |
| BR-22 | Deleting budget cascades to categories and transactions | Database (ON DELETE CASCADE)      | N/A          |
| BR-23 | Deleting category cascades to transactions              | Database (ON DELETE CASCADE)      | N/A          |
| BR-24 | User can only access their own budgets                  | Application layer (Authorization) | UNAUTHORIZED |
| BR-25 | Timestamps (createdAt, updatedAt) managed automatically | Database triggers or ORM          | N/A          |

---

### 5.6 Validation Rules Summary

**Budget Creation:**

```typescript
{
  name: required, string, max 200 chars
  type: required, enum ['monthly', 'scenario']
  month: required if type='monthly', 1-12
  year: required if type='monthly', > 2000
  month/year: must be null if type='scenario'
}
```

**Category Creation:**

```typescript
{
  name: required, string, max 100 chars
  type: required, enum ['income', 'expense']
  color: optional, hex color (#RRGGBB)
  icon: optional, string, max 50 chars
  targetPercentage: optional, number, 0-100
}
```

**Transaction Creation:**

```typescript
{
  title: required, string, max 200 chars
  amount: required, positive decimal (>0)
  currency: required, ISO 4217 code
  isPaid: boolean, default false
  note: optional, text
}
```

---

## 6. Architecture & Technology Stack

### 6.1 Technology Stack

**Full-Stack Framework:**

- **Framework**: SvelteKit (full-stack with server-side routes)
- **Runtime**: Node.js (via @sveltejs/adapter-node)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: Better Auth

**Frontend:**

- **Styling**: TailwindCSS
- **UI Components**: Melt UI / Bits UI (from @packages/ui)
- **State Management**: Svelte stores
- **Drag & Drop**: @dnd-kit/svelte or svelte-dnd-action
- **Forms**: Superforms + Zod
- **Charts**: Chart.js or Apache ECharts

**Infrastructure:**

- **Hosting**: TBD (VPS, Railway, or Render)
- **Database**: PostgreSQL (hosted via platform provider or managed service like Neon/Supabase)
- **Cache**: Redis (for exchange rates and sessions)
- **Storage**: Not needed for MVP

**Shared Packages:**

- **@packages/ui**: Shared UI components
- **@packages/tailwind-config**: Shared Tailwind configuration
- **@packages/tsconfig**: Shared TypeScript configuration

**External Services:**

- **Exchange Rates**: exchangerate-api.com (free tier)
- **Email**: TBD (Resend, SendGrid, or platform-provided email service)

---

### 6.2 Architecture Pattern

**Pattern:** SvelteKit Full-Stack with Server-Side Functions (Simplified DDD)

```
┌─────────────────────────────────────────┐
│      SvelteKit Frontend (Pages)         │
│  - Svelte components                    │
│  - Client-side state (stores)           │
│  - Form handling (Superforms)           │
│  - Progressive enhancement              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│   Server Layer (+page.server.ts)        │
│  - Load functions (data fetching)       │
│  - Form actions (mutations)             │
│  - Request validation (Zod)             │
│  - Error handling                       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│   Application Layer ($lib/server)       │
│  - Business logic (services)            │
│  - Use case implementation              │
│  - Domain rule enforcement              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│   Infrastructure Layer (Repositories)   │
│  - Database queries (Drizzle)           │
│  - External API calls                   │
│  - Data persistence                     │
└─────────────────────────────────────────┘
```

**Why This Pattern:**

- ✅ No traditional REST API needed (load functions + actions)
- ✅ Type-safe server functions (TypeScript end-to-end)
- ✅ Progressive enhancement built-in
- ✅ Clear separation of concerns
- ✅ Testable (each layer can be tested independently)
- ✅ Not over-engineered (no unnecessary abstractions)
- ✅ Easy to understand and maintain
- ✅ Full-stack in single codebase (faster development)
- ✅ Room to grow (can add domain layer if complexity increases)

---

### 6.3 Project Structure

```
zebabu/
├── src/
│   ├── routes/                 # SvelteKit routes (pages with server logic)
│   │   ├── (app)/              # Authenticated app routes
│   │   │   ├── budgets/        # Budget pages
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── +page.server.ts      # Load budgets + actions (create, delete)
│   │   │   │   ├── [id]/                # Single budget view
│   │   │   │   │   ├── +page.svelte
│   │   │   │   │   ├── +page.server.ts  # Load budget + actions (update, duplicate)
│   │   │   │   │   └── export/
│   │   │   │   │       └── +server.ts   # CSV export endpoint
│   │   │   │   └── import/
│   │   │   │       ├── +page.svelte
│   │   │   │       └── +page.server.ts  # CSV import action
│   │   │   └── +layout.svelte
│   │   │   └── +layout.server.ts        # Load user session
│   │   ├── auth/                        # Auth pages (login, register)
│   │   │   ├── login/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts      # Login action
│   │   │   └── register/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts      # Register action
│   │   └── +page.svelte                 # Homepage
│   │
│   ├── lib/
│   │   ├── components/                  # Svelte components
│   │   │   ├── budget/
│   │   │   ├── category/
│   │   │   └── transaction/
│   │   ├── stores/                      # Svelte stores
│   │   ├── server/                      # Server-only code ($lib/server)
│   │   │   ├── modules/
│   │   │   │   ├── auth/                # Auth module
│   │   │   │   │   ├── service.ts
│   │   │   │   │   └── repository.ts
│   │   │   │   ├── budget/              # Budget module (core)
│   │   │   │   │   ├── service.ts
│   │   │   │   │   └── repository.ts
│   │   │   │   ├── category/
│   │   │   │   │   ├── service.ts
│   │   │   │   │   └── repository.ts
│   │   │   │   ├── transaction/
│   │   │   │   │   ├── service.ts
│   │   │   │   │   └── repository.ts
│   │   │   │   ├── exchange-rates/
│   │   │   │   │   ├── service.ts
│   │   │   │   │   └── repository.ts
│   │   │   │   └── import-export/
│   │   │   │       ├── export.service.ts
│   │   │   │       └── import.service.ts
│   │   │   ├── db/                      # Drizzle schema & instance
│   │   │   │   ├── schema/
│   │   │   │   │   ├── users.ts
│   │   │   │   │   ├── budgets.ts
│   │   │   │   │   ├── categories.ts
│   │   │   │   │   ├── transactions.ts
│   │   │   │   │   └── exchange-rates.ts
│   │   │   │   └── index.ts
│   │   │   └── auth.ts                  # Better Auth config
│   │   └── utils/                       # Shared utilities
│   │
│   ├── hooks.server.ts                  # SvelteKit server hooks (auth)
│   ├── app.html
│   └── app.d.ts
│
├── packages/
│   ├── ui/                              # Shared UI components
│   │   ├── src/
│   │   │   └── components/
│   │   └── package.json
│   │
│   ├── tailwind-config/                 # Shared Tailwind config
│   │   ├── index.ts
│   │   └── package.json
│   │
│   └── tsconfig/                        # Shared TypeScript config
│       ├── base.json
│       └── package.json
│
├── drizzle.config.ts
├── svelte.config.js
├── package.json
├── pnpm-workspace.yaml
└── vite.config.ts
```

---

## 7. Module Structure

### 7.1 Budget Module (Core)

**Server-Side Logic:** `src/lib/server/modules/budget/`

```
budget/
├── service.ts                 # Budget CRUD, duplication, business logic
├── repository.ts              # Database queries (Drizzle)
└── validators.ts              # Zod schemas for validation
```

**Page Routes:** `src/routes/(app)/budgets/`

```
budgets/
├── +page.svelte               # Budget list page
├── +page.server.ts            # Load function + actions
│                              # - load: fetch all budgets
│                              # - actions: { create, delete }
│
├── [id]/
│   ├── +page.svelte           # Single budget page (Trello-like board)
│   ├── +page.server.ts        # Load function + actions
│   │                          # - load: fetch budget with categories & transactions
│   │                          # - actions: {
│   │                          #     updateBudget,
│   │                          #     duplicate,
│   │                          #     createCategory,
│   │                          #     updateCategory,
│   │                          #     deleteCategory,
│   │                          #     reorderCategories,
│   │                          #     createTransaction,
│   │                          #     updateTransaction,
│   │                          #     deleteTransaction,
│   │                          #     moveTransaction,
│   │                          #     reorderTransactions
│   │                          #   }
│   └── export/
│       └── +server.ts         # GET endpoint for CSV download
│
└── import/
    ├── +page.svelte           # CSV import page
    └── +page.server.ts        # Import action
```

**Responsibilities:**

- Budget lifecycle (create, read, update, delete, duplicate)
- Category management (CRUD, reordering)
- Transaction management (CRUD, moving between categories)
- Business rule enforcement
- Data validation

---

### 7.2 Auth Module

**Server-Side Logic:** `src/lib/server/modules/auth/`

```
auth/
├── service.ts                 # User management
└── repository.ts              # User queries
```

**Auth Pages:** `src/routes/auth/`

```
auth/
├── login/
│   ├── +page.svelte
│   └── +page.server.ts        # Login action (Better Auth integration)
│
└── register/
    ├── +page.svelte
    └── +page.server.ts        # Register action (Better Auth integration)
```

**SvelteKit Hooks:** `src/hooks.server.ts`

- Session validation (Better Auth)
- Protected route guards
- User context injection via `event.locals`

**Responsibilities:**

- User registration and login (Better Auth)
- Session management
- Password reset
- User profile CRUD

---

### 7.3 Exchange Rates Module

**Server-Side Logic:** `src/lib/server/modules/exchange-rates/`

```
exchange-rates/
├── service.ts                 # Rate fetching and caching
├── repository.ts              # Rate storage (PostgreSQL + Redis)
└── providers/
    └── exchangerate-api.ts    # External API integration
```

**Usage:**

- Called directly from load functions and actions
- No separate page routes needed (used as utility)
- Rates fetched on-demand and cached automatically

**Responsibilities:**

- Fetch exchange rates from external API
- Cache rates in Redis (24-hour TTL)
- Persist rates in PostgreSQL for historical tracking
- Provide conversion utility functions

---

### 7.4 Import/Export Module

**Server-Side Logic:** `src/lib/server/modules/import-export/`

```
import-export/
├── export.service.ts          # CSV export logic
└── import.service.ts          # CSV import logic
```

**Page Routes:**

- `src/routes/(app)/budgets/[id]/export/+server.ts` - CSV download endpoint
- `src/routes/(app)/budgets/import/+page.server.ts` - CSV import action

**Responsibilities:**

- Export budget to CSV
- Import budget from CSV
- Data validation during import

---

## 8. Server Functions & Data Flow

### 8.1 Overview

**Modern SvelteKit Approach:**

Instead of traditional REST API endpoints, this application uses:

1. **Load Functions** (`+page.server.ts`) - Server-side data fetching
2. **Form Actions** (`+page.server.ts`) - Server-side mutations
3. **Server Endpoints** (`+server.ts`) - Only for file downloads/uploads

**Benefits:**

- Type-safe end-to-end (TypeScript from client to server)
- No manual fetch calls needed (SvelteKit handles it)
- Progressive enhancement built-in
- Automatic data revalidation
- Direct function calls on server (no HTTP overhead)

### 8.2 Authentication

**Method:** Session-based (Better Auth)

**Session Management:**

- Handled via `hooks.server.ts`
- Session data available in `event.locals.session`
- Protected routes checked in load functions

**Example Protected Load Function:**

```typescript
// +page.server.ts
export async function load({ locals }) {
  if (!locals.session?.user) {
    redirect(302, '/auth/login')
  }
  return { user: locals.session.user }
}
```

---

### 8.3 Load Functions & Actions Summary

| Route                        | Load Function                              | Actions                                                                                                                                                                                                         | Auth |
| ---------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| **Authentication**           |                                            |                                                                                                                                                                                                                 |      |
| `/auth/login`                | n/a                                        | `login`                                                                                                                                                                                                         | No   |
| `/auth/register`             | n/a                                        | `register`                                                                                                                                                                                                      | No   |
| `/(app)/+layout`             | Load user session                          | `logout`                                                                                                                                                                                                        | Yes  |
| **Budgets**                  |                                            |                                                                                                                                                                                                                 |      |
| `/(app)/budgets`             | List all budgets                           | `create`, `delete`                                                                                                                                                                                              | Yes  |
| `/(app)/budgets/[id]`        | Load budget with categories & transactions | `updateBudget`, `duplicate`, `createCategory`, `updateCategory`, `deleteCategory`, `reorderCategories`, `createTransaction`, `updateTransaction`, `deleteTransaction`, `moveTransaction`, `reorderTransactions` | Yes  |
| **Import/Export**            |                                            |                                                                                                                                                                                                                 |      |
| `/(app)/budgets/[id]/export` | n/a (GET endpoint)                         | Download CSV                                                                                                                                                                                                    | Yes  |
| `/(app)/budgets/import`      | n/a                                        | `import`                                                                                                                                                                                                        | Yes  |

---

### 8.4 Detailed Function Specifications

#### 8.4.1 Budgets

**Route:** `/(app)/budgets/+page.server.ts`

**Load Function:**

```typescript
export async function load({ locals, url }) {
  const user = locals.session?.user
  if (!user) redirect(302, '/auth/login')

  // Optional filters from URL search params
  const type = url.searchParams.get('type') as 'monthly' | 'scenario' | null
  const year = url.searchParams.get('year')

  const budgets = await budgetService.listBudgets(user.id, { type, year })

  return { budgets }
}
```

**Return Type:**

```typescript
{
  budgets: Array<{
    id: string
    name: string
    type: 'monthly' | 'scenario'
    month: number | null
    year: number | null
    createdAt: Date
    updatedAt: Date
  }>
}
```

---

**Create Action:**

```typescript
export const actions = {
  create: async ({ request, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401, { message: 'Unauthorized' })

    const formData = await request.formData()
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      month: formData.get('month'),
      year: formData.get('year'),
    }

    // Validate with Zod
    const result = createBudgetSchema.safeParse(data)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten() })
    }

    try {
      const budget = await budgetService.createBudget(user.id, result.data)
      redirect(303, `/budgets/${budget.id}`)
    } catch (error) {
      if (error.code === 'DUPLICATE_MONTHLY_BUDGET') {
        return fail(409, { message: 'Budget for this month already exists' })
      }
      throw error
    }
  },
}
```

**Validation Schema:**

```typescript
const createBudgetSchema = z
  .object({
    name: z.string().min(1).max(200),
    type: z.enum(['monthly', 'scenario']),
    month: z.number().min(1).max(12).optional(),
    year: z.number().min(2000).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'monthly') {
        return data.month !== undefined && data.year !== undefined
      }
      return true
    },
    { message: 'Monthly budgets require month and year' },
  )
```

**Business Logic:**

- Auto-create 1 default income category ("Income")
- Auto-create 1 default expense category ("Expenses")
- For monthly: Check for existing budget for same month/year (BR-1)
- Redirect to budget detail page on success

---

**Route:** `/(app)/budgets/[id]/+page.server.ts`

**Load Function:**

```typescript
export async function load({ params, locals }) {
  const user = locals.session?.user
  if (!user) redirect(302, '/auth/login')

  const budget = await budgetService.getBudgetWithDetails(params.id, user.id)

  if (!budget) {
    error(404, 'Budget not found')
  }

  return { budget }
}
```

**Return Type:**

```typescript
{
  budget: {
    id: string
    name: string
    type: 'monthly' | 'scenario'
    month: number | null
    year: number | null
    categories: Array<{
      id: string
      name: string
      type: 'income' | 'expense'
      color: string | null
      icon: string | null
      order: number
      targetPercentage: string | null
      transactions: Array<{
        id: string
        title: string
        amount: string
        currency: string
        isPaid: boolean
        note: string | null
        order: number
        createdAt: Date
        updatedAt: Date
      }>
    }>
    createdAt: Date
    updatedAt: Date
  }
}
```

---

**Duplicate Action:**

```typescript
// In /(app)/budgets/[id]/+page.server.ts
export const actions = {
  duplicate: async ({ params, request, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401)

    const formData = await request.formData()
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      month: formData.get('month'),
      year: formData.get('year'),
    }

    const result = duplicateBudgetSchema.safeParse(data)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten() })
    }

    const newBudget = await budgetService.duplicateBudget(
      params.id,
      user.id,
      result.data,
    )

    redirect(303, `/budgets/${newBudget.id}`)
  },
}
```

**Business Logic:**

- Copy all categories (with new IDs)
- Copy all transactions (with new IDs)
- Reset all `isPaid` to `false`
- Preserve colors, icons, target percentages, order

---

**Delete Action:**

```typescript
// In /(app)/budgets/+page.server.ts
export const actions = {
  delete: async ({ request, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401)

    const formData = await request.formData()
    const budgetId = formData.get('budgetId')

    await budgetService.deleteBudget(budgetId, user.id)

    return { success: true }
  },
}
```

**Business Logic:**

- Cascades to all categories and transactions (database constraint)

---

#### 8.4.2 Categories

**Route:** `/(app)/budgets/[id]/+page.server.ts`

All category actions are in the budget detail page.

**Create Category Action:**

```typescript
createCategory: async ({ params, request, locals }) => {
  const formData = await request.formData()
  const data = categorySchema.parse({
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    icon: formData.get('icon'),
    targetPercentage: formData.get('targetPercentage'),
  })

  const category = await categoryService.createCategory(params.id, data)
  return { category }
}
```

**Update/Delete Category Actions:**

```typescript
updateCategory: async ({ request, locals }) => { /* ... */ },
deleteCategory: async ({ request, locals }) => {
  // Validates BR-8 and BR-9 (cannot delete last income/expense category)
  /* ... */
},
reorderCategories: async ({ request, locals }) => {
  // Updates order field based on array of category IDs
  /* ... */
}
```

---

#### 8.4.3 Transactions

**Route:** `/(app)/budgets/[id]/+page.server.ts`

All transaction actions are in the budget detail page.

**Create Transaction Action:**

```typescript
createTransaction: async ({ request, locals }) => {
  const formData = await request.formData()
  const data = transactionSchema.parse({
    categoryId: formData.get('categoryId'),
    title: formData.get('title'),
    amount: formData.get('amount'),
    currency: formData.get('currency'),
    isPaid: formData.get('isPaid') === 'true',
    note: formData.get('note'),
  })

  const transaction = await transactionService.createTransaction(data)
  return { transaction }
}
```

**Validation Schema:**

```typescript
const transactionSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  isPaid: z.boolean().default(false),
  note: z.string().max(1000).optional(),
})
```

**Other Transaction Actions:**

```typescript
updateTransaction: async ({ request }) => { /* ... */ },
deleteTransaction: async ({ request }) => { /* ... */ },
moveTransaction: async ({ request }) => {
  // Updates categoryId and resets order
  /* ... */
},
reorderTransactions: async ({ request }) => {
  // Updates order field based on array of transaction IDs
  /* ... */
}
```

---

#### 8.4.4 Exchange Rates

**Usage:** Called directly from load functions/actions (not a separate page route)

**Service Function:**

```typescript
// In $lib/server/modules/exchange-rates/service.ts
export async function getExchangeRate(
  from: string,
  to: string,
  date?: Date,
): Promise<ExchangeRate> {
  // 1. Check Redis cache (key: rate:CZK:EUR:2026-01-20)
  const cached = await getFromKV(`rate:${from}:${to}:${dateStr}`)
  if (cached) return cached

  // 2. Check PostgreSQL database
  const stored = await exchangeRateRepo.findRate(from, to, date)
  if (stored && !isStale(stored)) return stored

  // 3. Fetch from external API
  const rate = await exchangeRateProvider.fetchRate(from, to)

  // 4. Store in Redis (TTL: 24h) and PostgreSQL
  await storeRate(rate)

  return rate
}
```

**Called From Load Functions:**

```typescript
// Example in budget load function
const exchangeRates = await Promise.all(
  uniqueCurrencies.map((currency) =>
    exchangeRateService.getExchangeRate(currency, user.primaryCurrency),
  ),
)
```

---

#### 8.4.5 Import/Export

**Export Endpoint:** `/(app)/budgets/[id]/export/+server.ts`

```typescript
// GET handler for CSV download
export async function GET({ params, locals }) {
  const user = locals.session?.user
  if (!user) error(401)

  const budget = await budgetService.getBudgetWithDetails(params.id, user.id)
  if (!budget) error(404)

  const csv = await exportService.budgetToCSV(budget)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="budget-${budget.name}.csv"`,
    },
  })
}
```

---

**Import Action:** `/(app)/budgets/import/+page.server.ts`

```typescript
export const actions = {
  import: async ({ request, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const type = formData.get('type') as 'monthly' | 'scenario'

    // Parse CSV
    const csvContent = await file.text()
    const parsed = await importService.parseCSV(csvContent)

    // Validate
    if (!parsed.hasIncomeCategory || !parsed.hasExpenseCategory) {
      return fail(400, {
        message: 'Must have at least 1 income and 1 expense category',
      })
    }

    // Create budget
    const budget = await budgetService.createFromImport(user.id, {
      name,
      type,
      data: parsed,
    })

    redirect(303, `/budgets/${budget.id}`)
  },
}
```

---

### 8.5 Error Handling

**SvelteKit Actions:** Use `fail()` helper

```typescript
import { fail } from '@sveltejs/kit'

// Validation error
if (!result.success) {
  return fail(400, {
    errors: result.error.flatten(),
    message: 'Validation failed',
  })
}

// Business rule violation
if (isDuplicateBudget) {
  return fail(409, {
    message: 'Budget for this month already exists',
  })
}

// Unauthorized
if (!user) {
  return fail(401, { message: 'Unauthorized' })
}
```

**Load Functions:** Use `error()` and `redirect()`

```typescript
import { error, redirect } from '@sveltejs/kit'

// Not found
if (!budget) {
  error(404, 'Budget not found')
}

// Unauthorized (redirect to login)
if (!user) {
  redirect(302, '/auth/login')
}
```

**HTTP Status Codes:**

- `200` - Success
- `302/303` - Redirect (after successful action)
- `400` - Bad Request (validation error, business rule violation)
- `401` - Unauthorized (not authenticated)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate monthly budget)
- `500` - Internal Server Error

---

## 9. Epic Breakdown

### Epic 1: User Authentication & Profile Management

**Priority:** P0 (MVP Critical)  
**Estimated Story Points:** 8

**Description:**  
Users must be able to register, log in, and manage their profile settings (primary currency, locale).

**User Stories:**

- US-1.1: As a new user, I want to register with email and password
- US-1.2: As a registered user, I want to log in to access my budgets
- US-1.3: As a logged-in user, I want to log out
- US-1.4: As a user, I want to reset my password if I forget it
- US-1.5: As a user, I want to set my primary currency
- US-1.6: As a user, I want to set my locale for number formatting

**Acceptance Criteria:**

- Email validation (valid format, unique)
- Password requirements (min 8 chars, mix of letters/numbers)
- Session management via Better Auth
- Profile settings persist and affect app behavior

**Technical Tasks:**

- Set up Better Auth with SvelteKit
- Create user registration page and action
- Create login/logout pages and actions
- Create password reset flow (email integration)
- Implement profile settings in user layout
- Add authentication checks in `hooks.server.ts`

---

### Epic 2: Budget Management

**Priority:** P0 (MVP Critical)  
**Estimated Story Points:** 13

**Description:**  
Users can create, view, list, duplicate, and delete budgets (both monthly and scenario types).

**User Stories:**

- US-2.1: As a user, I want to create a monthly budget for a specific month/year
- US-2.2: As a user, I want to create a scenario budget for planning purposes
- US-2.3: As a user, I want to see a list of all my budgets
- US-2.4: As a user, I want to view a single budget with all its categories and transactions
- US-2.5: As a user, I want to duplicate an existing budget to quickly create next month's plan
- US-2.6: As a user, I want to delete a budget I no longer need
- US-2.7: As a user, I want to be prevented from creating duplicate monthly budgets for the same month

**Acceptance Criteria:**

- Monthly budgets require month/year, scenario budgets do not
- One monthly budget per month/year per user (enforced)
- New budgets auto-create default "Income" and "Expenses" categories
- Duplicating copies all categories and transactions with new IDs
- Deleting cascades to all categories and transactions

**Technical Tasks:**

- Create budget schema (Drizzle)
- Implement budget service (CRUD + duplicate logic)
- Implement budget repository
- Create budget list page with load function and actions
- Create budget detail page with load function
- Add duplicate, create, delete actions to budget pages
- Add validation for monthly budget uniqueness
- Write tests for business rules (BR-1 through BR-7)

---

### Epic 3: Category Management

**Priority:** P0 (MVP Critical)  
**Estimated Story Points:** 8

**Description:**  
Users can create, edit, delete, and reorder categories within a budget. Categories have names, types, colors, icons, and optional target percentages.

**User Stories:**

- US-3.1: As a user, I want to add a new category to my budget
- US-3.2: As a user, I want to edit a category's name, color, icon, and target percentage
- US-3.3: As a user, I want to delete a category (and its transactions)
- US-3.4: As a user, I want to reorder categories via drag and drop
- US-3.5: As a user, I want to be prevented from deleting the last income or expense category

**Acceptance Criteria:**

- Category types: income or expense
- Target percentage is optional (0-100)
- Cannot delete last income category (BR-8)
- Cannot delete last expense category (BR-9)
- Drag-and-drop updates order field

**Technical Tasks:**

- Create category schema (Drizzle)
- Implement category service (CRUD + reorder logic)
- Implement category repository
- Add category actions to budget detail page (create, update, delete, reorder)
- Add validation for last category deletion (BR-8, BR-9)
- Write tests for category business rules

---

### Epic 4: Transaction Management

**Priority:** P0 (MVP Critical)  
**Estimated Story Points:** 10

**Description:**  
Users can add, edit, delete, and move transactions between categories. Transactions have titles, amounts, currencies, paid status, and notes.

**User Stories:**

- US-4.1: As a user, I want to add a transaction to a category
- US-4.2: As a user, I want to edit a transaction's details
- US-4.3: As a user, I want to delete a transaction
- US-4.4: As a user, I want to mark a transaction as paid/unpaid
- US-4.5: As a user, I want to drag a transaction to a different category
- US-4.6: As a user, I want to reorder transactions within a category

**Acceptance Criteria:**

- Amount must be positive (BR-14)
- Currency must be valid ISO 4217 code (BR-15)
- Moving transaction updates categoryId and order
- Transactions support multi-currency

**Technical Tasks:**

- Create transaction schema (Drizzle)
- Implement transaction service (CRUD + move logic)
- Implement transaction repository
- Add transaction actions to budget detail page (create, update, delete, move, reorder)
- Add amount and currency validation (BR-14, BR-15)
- Write tests for transaction operations

---

### Epic 5: Budget Calculations & Validation

**Priority:** P0 (MVP Critical)  
**Estimated Story Points:** 5

**Description:**  
Frontend calculates and displays real-time budget totals, balances, allocation percentages, and warnings. Backend provides data; frontend computes summaries.

**User Stories:**

- US-5.1: As a user, I want to see total income for my budget
- US-5.2: As a user, I want to see total expenses for my budget
- US-5.3: As a user, I want to see my budget balance (income - expenses)
- US-5.4: As a user, I want to see what percentage of my income is allocated
- US-5.5: As a user, I want to see how much money is unallocated
- US-5.6: As a user, I want to be warned if I'm over budget
- US-5.7: As a user, I want to be warned if I haven't allocated all my income
- US-5.8: As a user, I want to see per-category totals and percentages
- US-5.9: As a user, I want to see variance between target and actual percentages per category

**Acceptance Criteria:**

- All calculations happen on frontend (client-side)
- Calculations update in real-time as user edits
- Warnings displayed prominently (W-1, W-2, W-3)
- Success message when budget is fully allocated (balance = 0)

**Technical Tasks:**

- Create frontend calculation utilities (Svelte stores or derived values)
- Implement real-time calculation logic (total income, expenses, balance, etc.)
- Create warning components (over budget, unallocated)
- Add per-category summary calculations
- Write frontend tests for calculation logic

---

### Epic 6: Multi-Currency Support

**Priority:** P1 (Important, not blocking MVP)  
**Estimated Story Points:** 8

**Description:**  
Users can enter transactions in different currencies. The app fetches exchange rates, caches them, and converts all amounts to the user's primary currency for display.

**User Stories:**

- US-6.1: As a user, I want to set my primary currency in my profile
- US-6.2: As a user, I want to add transactions in currencies different from my primary currency
- US-6.3: As a user, I want to see all amounts converted to my primary currency
- US-6.4: As a user, I want to see both the original amount/currency and converted amount
- US-6.5: As a user, I want the app to automatically fetch up-to-date exchange rates

**Acceptance Criteria:**

- Exchange rates fetched from external API (exchangerate-api.com)
- Rates cached in Redis (24-hour TTL) (BR-20)
- Rates also stored in D1 for historical tracking
- If rate unavailable, use 1:1 and show warning (BR-21)
- Display original + converted amounts in transaction details

**Technical Tasks:**

- Set up exchange rate API integration (exchangerate-api.com)
- Create exchange rate schema (Drizzle)
- Implement exchange rate service (fetch, cache in Redis, store in PostgreSQL)
- Create exchange rate repository
- Add currency conversion utilities (called from load functions)
- Integrate exchange rate fetching into budget load function
- Set up daily cron job (using node-cron or platform scheduler) to refresh rates
- Write tests for conversion logic

---

### Epic 7: Data Import/Export

**Priority:** P2 (Nice to have)  
**Estimated Story Points:** 5

**Description:**  
Users can export their budgets to CSV for backup or analysis in Excel. Users can import budgets from CSV to quickly set up new budgets.

**User Stories:**

- US-7.1: As a user, I want to export a budget to CSV
- US-7.2: As a user, I want to import a budget from CSV

**Acceptance Criteria:**

- CSV format: Category, CategoryType, TransactionTitle, Amount, Currency, IsPaid, Note
- Export generates downloadable CSV file
- Import validates CSV structure and data
- Import creates new budget (doesn't overwrite existing)
- Import requires at least 1 income and 1 expense category

**Technical Tasks:**

- Implement CSV export service (convert budget to CSV)
- Implement CSV import service (parse CSV, validate, create budget)
- Create export endpoint (+server.ts for CSV download)
- Create import page with action (+page.server.ts)
- Add CSV parsing library (e.g., Papa Parse)
- Write tests for CSV parsing and validation

---

### Epic 8: Trello-Like UI & Drag-and-Drop

**Priority:** P0 (MVP Critical)  
**Estimated Story Points:** 13

**Description:**  
Users interact with budgets via a visual Trello-like board where categories are columns and transactions are cards. Drag-and-drop for reordering and moving transactions between categories.

**User Stories:**

- US-8.1: As a user, I want to see my budget as a Trello-like board
- US-8.2: As a user, I want to drag categories to reorder them
- US-8.3: As a user, I want to drag transactions within a category to reorder them
- US-8.4: As a user, I want to drag transactions between categories to move them
- US-8.5: As a user, I want to click a transaction to edit it in a modal
- US-8.6: As a user, I want to add a new transaction via inline form or modal
- US-8.7: As a user, I want to add a new category via button

**Acceptance Criteria:**

- Visual board layout (categories as columns)
- Smooth drag-and-drop UX (responsive, no lag)
- Drag-and-drop updates order and categoryId
- Inline editing or modal editing for transactions
- Quick-add buttons for categories and transactions

**Technical Tasks:**

- Choose drag-and-drop library (@dnd-kit/svelte or svelte-dnd-action)
- Implement board layout component (Svelte)
- Implement category column component
- Implement transaction card component
- Implement drag-and-drop handlers (reorder, move between categories)
- Implement transaction edit modal
- Implement category/transaction quick-add forms
- Write frontend tests for drag-and-drop interactions

---

### Epic 9: Budget Insights & Statistics (Future)

**Priority:** P3 (Post-MVP)  
**Estimated Story Points:** 13

**Description:**  
Users can view historical trends, compare budgets across months, and see spending patterns over time.

**User Stories:**

- US-9.1: As a user, I want to see all my budgets for a specific year
- US-9.2: As a user, I want to compare spending across multiple months
- US-9.3: As a user, I want to see trends (income, expenses over time)
- US-9.4: As a user, I want to see average spending per category
- US-9.5: As a user, I want to see charts/graphs of my budget data

**Acceptance Criteria:**

- Year view shows all monthly budgets
- Comparison view shows side-by-side budget summaries
- Trend charts (line charts, bar charts)
- Average calculations across selected time range

**Technical Tasks:**

- Implement year view component
- Implement comparison view component
- Implement chart components (Chart.js or ECharts)
- Create statistics calculation utilities
- Add filtering/date range selection
- Write tests for statistics calculations

---

## 10. User Stories

### 10.1 User Story Template

```
As a [user type],
I want to [action],
So that [benefit].

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2

Definition of Done:
- [ ] Code implemented and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Documentation updated
- [ ] Feature deployed to staging
- [ ] QA sign-off
```

---

### 10.2 Priority User Stories (MVP)

**US-2.1: Create Monthly Budget**

As a user,  
I want to create a monthly budget for a specific month/year,  
So that I can plan my finances for that period.

**Acceptance Criteria:**

- Budget creation form requires: month (1-12), year (>= 2000)
- System auto-generates name (e.g., "January 2026")
- System prevents duplicate monthly budgets for same month/year
- System auto-creates default "Income" and "Expenses" categories
- Success message shown after creation
- User redirected to newly created budget view

**Definition of Done:**

- Budget list page with create action implemented
- Frontend form implemented with validation (Superforms + Zod)
- Uniqueness constraint enforced (BR-1)
- Unit tests cover happy path and duplicate scenario
- Integration test verifies end-to-end flow

---

**US-2.5: Duplicate Budget**

As a user,  
I want to duplicate an existing budget,  
So that I can quickly set up next month's budget without starting from scratch.

**Acceptance Criteria:**

- Duplication form requires: new name, type, month/year (if monthly)
- System copies all categories with same names, colors, icons, target percentages
- System copies all transactions with same titles, amounts, currencies, notes
- All `isPaid` flags reset to `false`
- All IDs are new (not copied)
- Order preserved for categories and transactions
- Success message shown with link to new budget

**Definition of Done:**

- Duplicate action implemented in budget detail page
- Frontend duplication modal implemented
- Service logic copies entire budget hierarchy
- Unit tests verify copying logic
- Integration test verifies duplicated budget structure

---

**US-3.5: Prevent Deleting Last Category**

As a user,  
I want to be prevented from deleting the last income or expense category,  
So that my budget remains valid.

**Acceptance Criteria:**

- Delete button disabled if category is the last of its type
- Tooltip explains why deletion is disabled
- If user attempts deletion via action, receives validation error
- Error message: "Cannot delete last [income/expense] category"

**Definition of Done:**

- Validation logic implemented in service layer
- Frontend disables delete button conditionally
- Unit tests verify BR-8 and BR-9
- Integration test verifies API returns correct error

---

**US-4.5: Move Transaction Between Categories**

As a user,  
I want to drag a transaction to a different category,  
So that I can reorganize my budget easily.

**Acceptance Criteria:**

- User can drag transaction from one category column to another
- Transaction visually moves during drag
- Drop updates transaction's categoryId
- Transaction order resets to end of new category
- Move action called to persist change
- If action fails, transaction reverts to original position
- Success feedback (subtle animation or toast)

**Definition of Done:**

- Drag-and-drop implemented in frontend (Svelte)
- Move transaction action implemented in budget detail page
- Optimistic UI updates with rollback on error (use:enhance)
- Unit tests for move logic
- Integration test verifies categoryId update

---

**US-5.6: Warn If Over Budget**

As a user,  
I want to be warned if my total expenses exceed my total income,  
So that I'm aware I need to adjust my budget.

**Acceptance Criteria:**

- Warning displayed when total expenses > total income
- Warning shows amount over budget (e.g., "Over budget by 2,400 CZK")
- Warning styled prominently (red, exclamation icon)
- Warning updates in real-time as user edits
- Warning disappears when balance becomes non-negative

**Definition of Done:**

- Frontend calculation logic implemented
- Warning component implemented (Svelte)
- Real-time reactivity verified
- Styling matches design mockups
- Manual testing confirms UX

---

**US-6.3: Convert Multi-Currency Amounts**

As a user,  
I want to see all amounts converted to my primary currency,  
So that I can understand my total budget in one currency.

**Acceptance Criteria:**

- All transaction amounts displayed in user's primary currency
- Original amount/currency shown in parentheses or tooltip
- Exchange rate fetched from API and cached
- If rate unavailable, show 1:1 conversion with warning icon
- Conversion updates when exchange rates refresh

**Definition of Done:**

- Conversion utility functions implemented (frontend and backend)
- Exchange rate API integration completed
- Cache implemented (Redis, 24-hour TTL)
- Unit tests for conversion logic
- Integration test verifies rate fetching and caching

---

**US-8.4: Drag Transaction Between Categories**

As a user,  
I want to drag transactions between categories to move them,  
So that I can quickly reorganize my budget.

**Acceptance Criteria:**

- Same as US-4.5 (duplicate for clarity)

---

## 11. Data Flow & Calculations

### 11.1 Frontend Calculation Flow

**When to Calculate:**

- On initial budget load
- After any transaction create/update/delete
- After any transaction move between categories
- After category create/delete
- Real-time as user types in transaction amounts

**What to Calculate:**

```typescript
// Pseudocode for frontend calculations

function calculateBudgetSummary(budget: Budget): BudgetSummary {
  const incomeCategories = budget.categories.filter((c) => c.type === 'income')
  const expenseCategories = budget.categories.filter(
    (c) => c.type === 'expense',
  )

  // Convert all transactions to primary currency
  const allTransactions = budget.categories.flatMap((c) => c.transactions)
  const convertedTransactions = allTransactions.map((t) =>
    convertToPrimaryCurrency(t, exchangeRates, user.primaryCurrency),
  )

  // Calculate totals
  const totalIncome = convertedTransactions
    .filter((t) => incomeCategories.some((c) => c.id === t.categoryId))
    .reduce((sum, t) => sum + t.amountInBaseCurrency, 0)

  const totalExpenses = convertedTransactions
    .filter((t) => expenseCategories.some((c) => c.id === t.categoryId))
    .reduce((sum, t) => sum + t.amountInBaseCurrency, 0)

  const balance = totalIncome - totalExpenses
  const allocatedPercentage =
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
  const unallocatedAmount = balance > 0 ? balance : 0

  return {
    totalIncome,
    totalExpenses,
    balance,
    allocatedPercentage,
    unallocatedAmount,
    isFullyAllocated: Math.abs(balance) < 0.01, // within 1 cent
    isOverBudget: balance < 0,
  }
}

function calculateCategorySummary(
  category: Category,
  totalIncome: number,
): CategorySummary {
  const total = category.transactions.reduce(
    (sum, t) =>
      sum +
      convertToPrimaryCurrency(t, exchangeRates, user.primaryCurrency)
        .amountInBaseCurrency,
    0,
  )

  const actualPercentage = totalIncome > 0 ? (total / totalIncome) * 100 : 0
  const variance = category.targetPercentage
    ? actualPercentage - category.targetPercentage
    : null

  const paidCount = category.transactions.filter((t) => t.isPaid).length
  const unpaidCount = category.transactions.length - paidCount

  return {
    total,
    actualPercentage,
    targetPercentage: category.targetPercentage,
    variance,
    transactionCount: category.transactions.length,
    paidCount,
    unpaidCount,
  }
}
```

**Where to Store:**

- Svelte stores (reactive state)
- Derived stores for calculations (auto-update when dependencies change)

**Example Svelte Store:**

```typescript
// stores/budget.ts
import { derived, writable } from 'svelte/store'

export const currentBudget = writable<Budget | null>(null)
export const exchangeRates = writable<ExchangeRate[]>([])

export const budgetSummary = derived(
  [currentBudget, exchangeRates],
  ([$budget, $rates]) => {
    if (!$budget) return null
    return calculateBudgetSummary($budget, $rates)
  },
)

export const categorySummaries = derived(
  [currentBudget, budgetSummary, exchangeRates],
  ([$budget, $summary, $rates]) => {
    if (!$budget || !$summary) return []
    return $budget.categories.map((c) =>
      calculateCategorySummary(c, $summary.totalIncome, $rates),
    )
  },
)
```

---

### 11.2 Currency Conversion Flow

**Scenario:** User has primary currency = EUR, adds transaction in CZK

```
1. User submits form: 2500 CZK
2. Form action receives data and saves: amount=2500, currency='CZK'
3. Page reloads/revalidates, load function runs:
   a. Fetches budget with all transactions
   b. Identifies unique currencies needed (CZK)
   c. Calls exchangeRateService.getExchangeRate('CZK', 'EUR')
      - Service checks Redis cache (key: rate:CZK:EUR:2026-01-20)
      - If cached, return immediately
      - If not cached, fetch from exchangerate-api.com
      - Store in Redis (TTL: 24h) and PostgreSQL
   d. Returns budget data + exchange rates to frontend
4. Frontend receives data with exchange rates
5. Frontend calculates (in Svelte component): 2500 * 0.041234 = 103.09 EUR
6. Display: "2500 CZK (103.09 EUR)"
```

**Rate Refresh Strategy:**

- Scheduled cron job runs daily at 00:00 UTC
- Fetches rates for all currencies used by active users
- Updates Redis cache and PostgreSQL table
- On page load, if rate is stale (> 24h), fetches fresh rate

---

### 11.3 Budget Duplication Flow

**Scenario:** User duplicates "January 2026" to create "February 2026"

```
1. User clicks "Duplicate" on January budget
2. Modal opens: "Create new budget from January 2026"
   - Name: "February 2026"
   - Type: Monthly
   - Month: 2
   - Year: 2026
3. User clicks "Create"
4. Form submits to duplicate action with:
   formData: { name: "February 2026", type: "monthly", month: 2, year: 2026 }
5. Server action runs:
   a. Fetch source budget with all categories and transactions
   b. Validate: no existing budget for Feb 2026 (BR-1)
   c. Create new budget with new ID
   d. For each category:
      - Create new category with new ID
      - Copy: name, type, color, icon, order, targetPercentage
   e. For each transaction:
      - Create new transaction with new ID
      - Copy: title, amount, currency, note, order
      - Reset: isPaid = false
   f. Save all to database (transaction)
6. Action completes and redirects: redirect(303, `/budgets/${newBudget.id}`)
7. Browser navigates to new budget view
```

---

## 12. Security Considerations

### 12.1 Authentication & Authorization

**Authentication:**

- Better Auth handles session management
- Session token stored in HTTP-only cookie
- Token validated via `hooks.server.ts` on every request
- Session available in `event.locals.session`
- Tokens expire after 7 days (configurable)

**Authorization:**

- Users can only access their own budgets
- Every budget query includes `userId` filter
- Load functions and actions check ownership before allowing access
- Example:

  ```typescript
  // In load function or action
  const user = locals.session?.user
  if (!user) redirect(302, '/auth/login')

  const budget = await db.query.budgets.findFirst({
    where: and(
      eq(budgets.id, budgetId),
      eq(budgets.userId, user.id), // Authorization check
    ),
  })

  if (!budget) error(404, 'Budget not found')
  ```

---

### 12.2 Input Validation

**Validation Layers:**

1. **Frontend (UX):** Zod schemas via Superforms, immediate feedback
2. **Backend (Security):** Zod schemas in every action/load function, never trust client

**What to Validate:**

- Data types (string, number, boolean)
- Required fields
- String lengths (max chars)
- Number ranges (min/max)
- Enum values (exact match)
- Format patterns (email, ISO 4217 currency codes, hex colors)

**Example Validation:**

```typescript
import { z } from 'zod'

export const createTransactionSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/), // ISO 4217
  isPaid: z.boolean().default(false),
  note: z.string().max(1000).optional(),
})
```

---

### 12.3 SQL Injection Prevention

**Protection:** Drizzle ORM uses parameterized queries

**Example (Safe):**

```typescript
// Drizzle automatically parameterizes
const result = await db.select().from(budgets).where(eq(budgets.id, budgetId))
```

**Never Do:**

```typescript
// UNSAFE - string interpolation
const result = await db.execute(
  `SELECT * FROM budgets WHERE id = '${budgetId}'`,
)
```

---

### 12.4 Rate Limiting

**Strategy:** Use Redis-based rate limiting

**Limits:**

- Login action: 5 attempts per 15 minutes per IP
- Form actions: 100 requests per minute per user
- Export download: 10 requests per hour per user (heavy operation)

**Implementation:**

```typescript
// Pseudocode using Redis
async function checkRateLimit(userId: string, limit: number, window: number) {
  const key = `ratelimit:${userId}:${Math.floor(Date.now() / window)}`
  const count = await redis.get(key)

  if (count && parseInt(count) >= limit) {
    throw new RateLimitError()
  }

  await redis.incr(key)
  await redis.expire(key, window / 1000) // Convert ms to seconds
}
```

---

### 12.5 CORS Configuration

**Policy:** With SvelteKit full-stack, CORS is typically not needed for same-origin requests. For external API access (if required), handle via `hooks.server.ts`:

```typescript
// src/hooks.server.ts
export async function handle({ event, resolve }) {
  const response = await resolve(event)

  // Only set CORS headers for API routes if needed
  if (event.url.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE',
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    )
  }

  return response
}
```

**Note:** Since frontend and API are in the same SvelteKit app, most CORS issues are avoided by default.

---

### 12.6 Secrets Management

**Sensitive Data:**

- Database connection string (PostgreSQL)
- Redis connection string
- Better Auth secret key
- Exchange rate API key
- Email service credentials

**Storage:** Environment variables (via platform provider or .env files)

**Never Commit:**

- `.env` files (add to `.gitignore`)
- API keys in code

---

## 13. Performance Requirements

### 13.1 Response Time Targets

| Operation                      | Target   | Acceptable |
| ------------------------------ | -------- | ---------- |
| Budget list load               | < 200ms  | < 500ms    |
| Single budget load             | < 300ms  | < 800ms    |
| Create transaction             | < 150ms  | < 400ms    |
| Drag & drop update             | < 100ms  | < 300ms    |
| Exchange rate fetch (cached)   | < 50ms   | < 150ms    |
| Exchange rate fetch (uncached) | < 1000ms | < 2000ms   |

---

### 13.2 Scalability Targets

**MVP Targets:**

- 1,000 active users
- 10,000 budgets total
- 100,000 transactions total
- 100 concurrent users

**Deployment Platform Benefits:**

- **VPS**: Full control, dedicated resources, cost-effective at scale
- **Railway/Render**: Auto-scaling, managed infrastructure, easy deployment
- PostgreSQL connection pooling for optimal performance
- Redis for fast caching and session storage

---

### 13.3 Database Optimization

**Indexes (Already Defined):**

- Foreign keys automatically indexed
- Additional indexes on frequently queried fields (userId, budgetId, categoryId)

**Query Optimization:**

- Use `SELECT` with specific columns (not `SELECT *`)
- Use joins to fetch related data in single query (budget with categories and transactions)
- Limit result sets where appropriate

**Example Optimized Query:**

```typescript
// Fetch budget with all related data in one query
const budget = await db.query.budgets.findFirst({
  where: and(eq(budgets.id, budgetId), eq(budgets.userId, userId)),
  with: {
    categories: {
      orderBy: asc(categories.order),
      with: {
        transactions: {
          orderBy: asc(transactions.order),
        },
      },
    },
  },
})
```

---

### 13.4 Frontend Performance

**Optimization Strategies:**

- Code splitting (lazy load routes)
- Tree shaking (only bundle used code)
- Minimize bundle size (< 500 KB for main bundle)
- Use Svelte's reactive updates (only re-render what changes)
- Debounce expensive calculations (e.g., delay calculation until 300ms after last edit)
- Virtualize long lists (if categories/transactions > 100)

**Example Debounce:**

```typescript
import { debounce } from 'lodash-es'

const debouncedCalculate = debounce(() => {
  budgetSummary.set(calculateBudgetSummary($currentBudget))
}, 300)
```

---

## 14. Future Enhancements

### 14.1 Post-MVP Features

**Phase 2 (3-6 months):**

- Advanced reporting & analytics (Epic 9)
- Budget comparison across months
- Trend charts (income/expenses over time)
- Category spending insights
- Export to PDF
- Mobile apps (iOS, Android)

**Phase 3 (6-12 months):**

- Multi-user/household budgets
- Budget sharing & collaboration (view-only or edit)
- Recurring transaction templates
- Budget goals & savings targets
- Notifications (email/push for milestones)

**Phase 4 (12+ months):**

- Bank account integration (read-only, sync transactions)
- AI-powered insights ("You're overspending on dining out")
- Budget recommendations based on spending patterns
- Community budget templates marketplace

---

### 14.2 Technical Debt & Refactoring

**Known Trade-offs:**

- Frontend calculations: May need to move to backend for performance
- No caching layer: Consider Redis/KV for budget summaries
- No background jobs: May need queue system for heavy operations (e.g., bulk imports)

**Monitoring Needs:**

- Error tracking (Sentry or similar)
- Performance monitoring (platform-provided analytics or custom APM)
- User analytics (PostHog or similar)

---

## 15. Appendices

### 15.1 Glossary

| Term                 | Definition                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Zero-Based Budgeting | Budgeting method where every unit of income is allocated to a category, resulting in a balance of zero. |
| Aggregate Root       | In DDD, the main entity that controls access to related entities.                                       |
| Cascade Delete       | Database operation where deleting a parent record automatically deletes child records.                  |
| ISO 4217             | International standard for currency codes (e.g., USD, EUR, CZK).                                        |
| Discriminated Union  | TypeScript pattern for type-safe error handling using tagged union types.                               |

---

### 15.2 References

**Technologies:**

- SvelteKit: https://kit.svelte.dev/
- Drizzle ORM: https://orm.drizzle.team/
- PostgreSQL: https://www.postgresql.org/
- Redis: https://redis.io/
- Better Auth: https://www.better-auth.com/
- TailwindCSS: https://tailwindcss.com/
- Melt UI: https://melt-ui.com/

**Deployment Platforms:**

- Railway: https://railway.app/
- Render: https://render.com/
- Neon (PostgreSQL hosting): https://neon.tech/
- Supabase (PostgreSQL hosting): https://supabase.com/

**Standards:**

- ISO 4217 Currency Codes: https://www.iso.org/iso-4217-currency-codes.html
- SvelteKit Form Actions: https://kit.svelte.dev/docs/form-actions

**External APIs:**

- Exchange Rate API: https://www.exchangerate-api.com/

---

### 15.3 Revision History

| Version | Date       | Author         | Changes               |
| ------- | ---------- | -------------- | --------------------- |
| 1.0     | 2026-01-20 | Technical Team | Initial specification |

---

## End of Document

**This specification is ready for implementation.**

Next steps:

1. Review and approve this spec
2. Set up project repository and scaffolding
3. Begin Epic 1 (Authentication)
4. Iterate through epics in priority order

Questions? Contact the technical team.
