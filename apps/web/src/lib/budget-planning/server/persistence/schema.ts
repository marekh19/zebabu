import { relations, sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  type AnyPgTable,
  boolean,
  check,
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

type UserTable = AnyPgTable & { id: AnyPgColumn }

export function createBudgetPlanningSchema(user: UserTable) {
  const budgetTypeEnum = pgEnum('budget_type', ['monthly', 'scenario'])
  const categoryTypeEnum = pgEnum('category_type', ['income', 'expense'])
  const categoryColorEnum = pgEnum('category_color', [
    'slate',
    'rose',
    'emerald',
    'amber',
    'sky',
    'violet',
    'orange',
    'teal',
  ])

  const budget = pgTable(
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
      unique('budget_userId_name_unique').on(table.userId, table.name),
      check(
        'budget_shape_check',
        sql`(${table.type} = 'monthly' and ${table.month} between 1 and 12 and ${table.year} between 2000 and 2100 and ${table.name} is null) or (${table.type} = 'scenario' and length(trim(${table.name})) > 0 and ${table.month} is null and ${table.year} is null)`,
      ),
    ],
  )

  const category = pgTable(
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
      color: categoryColorEnum('color').notNull().default('slate'),
      defaultAllocationTarget: numeric('default_allocation_target', {
        precision: 4,
        scale: 1,
      }),
      createdAt: timestamp('created_at').defaultNow().notNull(),
      updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    },
    (table) => [
      index('category_userId_idx').on(table.userId),
      unique('category_userId_name_unique').on(table.userId, table.name),
      check(
        'category_default_allocation_target_check',
        sql`${table.defaultAllocationTarget} is null or ${table.defaultAllocationTarget} between 0.0 and 100.0`,
      ),
    ],
  )

  const budgetCategory = pgTable(
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
      allocationTarget: numeric('allocation_target', {
        precision: 4,
        scale: 1,
      }),
      createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => [
      index('budgetCategory_budgetId_idx').on(table.budgetId),
      index('budgetCategory_categoryId_idx').on(table.categoryId),
      unique('budgetCategory_budgetId_categoryId_unique').on(
        table.budgetId,
        table.categoryId,
      ),
      check('budget_category_sort_order_check', sql`${table.sortOrder} >= 0`),
      check(
        'budget_category_allocation_target_check',
        sql`${table.allocationTarget} is null or ${table.allocationTarget} between 0.0 and 100.0`,
      ),
    ],
  )

  const transaction = pgTable(
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
      check('transaction_amount_check', sql`${table.amount} > 0`),
      check('transaction_sort_order_check', sql`${table.sortOrder} >= 0`),
    ],
  )

  const budgetRelations = relations(budget, ({ one, many }) => ({
    user: one(user, {
      fields: [budget.userId],
      references: [user.id],
    }),
    budgetCategories: many(budgetCategory),
  }))

  const categoryRelations = relations(category, ({ one, many }) => ({
    user: one(user, {
      fields: [category.userId],
      references: [user.id],
    }),
    budgetCategories: many(budgetCategory),
  }))

  const budgetCategoryRelations = relations(
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

  const transactionRelations = relations(transaction, ({ one }) => ({
    budgetCategory: one(budgetCategory, {
      fields: [transaction.budgetCategoryId],
      references: [budgetCategory.id],
    }),
  }))

  return {
    budgetTypeEnum,
    categoryTypeEnum,
    categoryColorEnum,
    budget,
    category,
    budgetCategory,
    transaction,
    budgetRelations,
    categoryRelations,
    budgetCategoryRelations,
    transactionRelations,
  }
}

export type BudgetPlanningSchema = ReturnType<typeof createBudgetPlanningSchema>
