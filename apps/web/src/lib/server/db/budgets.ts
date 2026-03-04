import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { user } from './schema'

export const budgetTypeEnum = pgEnum('budget_type', ['monthly', 'scenario'])
export const categoryTypeEnum = pgEnum('category_type', ['income', 'expense'])

export const budget = pgTable(
  'budget',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: budgetTypeEnum('type').notNull(),
    month: integer('month'),
    year: integer('year'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('budget_userId_idx').on(table.userId),
    unique('budget_userId_month_year_unique').on(
      table.userId,
      table.month,
      table.year,
    ),
  ],
)

export const category = pgTable(
  'category',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    budgetId: text('budget_id')
      .notNull()
      .references(() => budget.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: categoryTypeEnum('type').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('category_budgetId_idx').on(table.budgetId)],
)

export const transaction = pgTable(
  'transaction',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    categoryId: text('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    note: text('note'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    isPaid: boolean('is_paid').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('transaction_categoryId_idx').on(table.categoryId)],
)

export const budgetRelations = relations(budget, ({ one, many }) => ({
  user: one(user, {
    fields: [budget.userId],
    references: [user.id],
  }),
  categories: many(category),
}))

export const categoryRelations = relations(category, ({ one, many }) => ({
  budget: one(budget, {
    fields: [category.budgetId],
    references: [budget.id],
  }),
  transactions: many(transaction),
}))

export const transactionRelations = relations(transaction, ({ one }) => ({
  category: one(category, {
    fields: [transaction.categoryId],
    references: [category.id],
  }),
}))
