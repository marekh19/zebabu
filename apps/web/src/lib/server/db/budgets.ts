import { relations } from 'drizzle-orm'
import {
  index,
  integer,
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

export const budgetRelations = relations(budget, ({ one, many }) => ({
  user: one(user, {
    fields: [budget.userId],
    references: [user.id],
  }),
  categories: many(category),
}))

export const categoryRelations = relations(category, ({ one }) => ({
  budget: one(budget, {
    fields: [category.budgetId],
    references: [budget.id],
  }),
}))
