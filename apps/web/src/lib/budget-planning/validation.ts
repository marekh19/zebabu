import { z } from 'zod'
import {
  hasAllocationTargetPrecision,
  hasCompleteAllocationTargetTotal,
  isAllocationTargetInRange,
} from './allocation-targets/rules'
import { categoryColors } from './categories/colors'

export const MAX_TRANSACTION_AMOUNT = 9_999_999_999.99

export const budgetInputRule = z
  .object({
    type: z.enum(['monthly', 'scenario']),
    useDefaultAllocationTargets: z.boolean().default(false),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    name: z.string().trim().max(200).optional(),
  })
  .refine(
    ({ type, month, year }) =>
      type !== 'monthly' || (month !== undefined && year !== undefined),
  )
  .refine(
    ({ type, name }) =>
      type !== 'scenario' || (name !== undefined && name.length > 0),
  )

export const duplicateBudgetRule = z
  .object({
    sourceBudgetId: z.string().min(1),
    type: z.enum(['monthly', 'scenario']),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    name: z.string().trim().max(200).optional(),
  })
  .refine(
    ({ type, month, year }) =>
      type !== 'monthly' || (month !== undefined && year !== undefined),
  )
  .refine(
    ({ type, name }) =>
      type !== 'scenario' || (name !== undefined && name.length > 0),
  )

export const createCategoryRule = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['income', 'expense']),
  color: z.enum(categoryColors),
})

export const updateCategoryRule = createCategoryRule
  .omit({ type: true })
  .extend({ categoryId: z.string().min(1) })

export const transactionFieldsRule = z.object({
  name: z.string().trim().min(1).max(200),
  amount: z.number().positive().max(MAX_TRANSACTION_AMOUNT).multipleOf(0.01),
  isPaid: z.boolean(),
  note: z.string().trim().max(1000).optional(),
})

export const createTransactionRule = transactionFieldsRule.extend({
  budgetCategoryId: z.string().min(1),
})

export const updateTransactionRule = transactionFieldsRule.extend({
  transactionId: z.string().min(1),
})

const allocationTargetRule = z.object({
  categoryId: z.string().min(1),
  value: z
    .number()
    .refine(isAllocationTargetInRange)
    .refine(hasAllocationTargetPrecision),
})

export const allocationTargetsRule = z
  .object({
    enabled: z.boolean(),
    targets: z.array(allocationTargetRule),
  })
  .refine(
    ({ enabled, targets }) =>
      !enabled || hasCompleteAllocationTargetTotal(targets),
  )
