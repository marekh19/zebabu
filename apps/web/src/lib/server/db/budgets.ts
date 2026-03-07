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
import { account, session, user } from '../../auth/schema'

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
    name: text('name'),
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
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: categoryTypeEnum('type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('category_userId_idx').on(table.userId),
    unique('category_userId_name_unique').on(table.userId, table.name),
  ],
)

export const budgetCategory = pgTable(
  'budget_category',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    budgetId: text('budget_id')
      .notNull()
      .references(() => budget.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'restrict' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('budgetCategory_budgetId_idx').on(table.budgetId),
    index('budgetCategory_categoryId_idx').on(table.categoryId),
    unique('budgetCategory_budgetId_categoryId_unique').on(
      table.budgetId,
      table.categoryId,
    ),
  ],
)

export const transaction = pgTable(
  'transaction',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    budgetCategoryId: text('budget_category_id')
      .notNull()
      .references(() => budgetCategory.id, { onDelete: 'cascade' }),
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
  (table) => [
    index('transaction_budgetCategoryId_idx').on(table.budgetCategoryId),
  ],
)

// --- Relations ---

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  budgets: many(budget),
  categories: many(category),
}))

export const budgetRelations = relations(budget, ({ one, many }) => ({
  user: one(user, {
    fields: [budget.userId],
    references: [user.id],
  }),
  budgetCategories: many(budgetCategory),
}))

export const categoryRelations = relations(category, ({ one, many }) => ({
  user: one(user, {
    fields: [category.userId],
    references: [user.id],
  }),
  budgetCategories: many(budgetCategory),
}))

export const budgetCategoryRelations = relations(
  budgetCategory,
  ({ one, many }) => ({
    budget: one(budget, {
      fields: [budgetCategory.budgetId],
      references: [budget.id],
    }),
    category: one(category, {
      fields: [budgetCategory.categoryId],
      references: [category.id],
    }),
    transactions: many(transaction),
  }),
)

export const transactionRelations = relations(transaction, ({ one }) => ({
  budgetCategory: one(budgetCategory, {
    fields: [transaction.budgetCategoryId],
    references: [budgetCategory.id],
  }),
}))
