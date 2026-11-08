import { z } from 'zod'
import { protectedContract } from './base'
import { categoryColorSchema, categoryTypeSchema } from './categories'
import {
  idSchema,
  moneySchema,
  percentageSchema,
  timestampSchema,
} from './schemas'

const monthlyBudgetSchema = z.strictObject({
  id: idSchema,
  type: z.literal('monthly'),
  name: z.null(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
})

const scenarioBudgetSchema = z.strictObject({
  id: idSchema,
  type: z.literal('scenario'),
  name: z.string().trim().min(1).max(200),
  month: z.null(),
  year: z.null(),
})

export const budgetReferenceSchema = z.discriminatedUnion('type', [
  monthlyBudgetSchema,
  scenarioBudgetSchema,
])

export const budgetTargetSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('monthly'),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
    useDefaultAllocationTargets: z.boolean(),
  }),
  z.strictObject({
    type: z.literal('scenario'),
    name: z.string().trim().min(1).max(200),
    useDefaultAllocationTargets: z.boolean(),
  }),
])

export const duplicateBudgetTargetSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('monthly'),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
  }),
  z.strictObject({
    type: z.literal('scenario'),
    name: z.string().trim().min(1).max(200),
  }),
])

const transactionAmountSchema = moneySchema.refine((value) => value !== '0.00')

export const plannedTransactionSchema = z.strictObject({
  id: idSchema,
  name: z.string().trim().min(1).max(200),
  note: z.string().max(1000).nullable(),
  amount: transactionAmountSchema,
  isPaid: z.boolean(),
})

export const transactionFieldsSchema = plannedTransactionSchema
  .omit({ id: true })
  .extend({
    note: z.string().trim().max(1000).optional(),
  })

export const budgetCategorySchema = z.strictObject({
  id: idSchema,
  allocationTarget: percentageSchema.nullable(),
  category: z.strictObject({
    id: idSchema,
    name: z.string().min(1).max(100),
    type: categoryTypeSchema,
    color: categoryColorSchema,
  }),
  transactions: z.array(plannedTransactionSchema),
})

export const budgetDetailSchema = z.discriminatedUnion('type', [
  monthlyBudgetSchema.extend({
    budgetCategories: z.array(budgetCategorySchema),
  }),
  scenarioBudgetSchema.extend({
    budgetCategories: z.array(budgetCategorySchema),
  }),
])

export const budgetPageSchema = z.strictObject({
  budget: budgetDetailSchema,
  availableCategories: z.array(
    z.strictObject({ id: idSchema, name: z.string() }),
  ),
})

export const budgetAllocationTargetsSchema = z.strictObject({
  enabled: z.boolean(),
  targets: z.array(
    z.strictObject({ budgetCategoryId: idSchema, value: percentageSchema }),
  ),
})

const budgetIdInput = z.strictObject({ budgetId: idSchema })
const budgetCategoryIdInput = budgetIdInput.extend({
  budgetCategoryId: idSchema,
})
const transactionIdInput = budgetIdInput.extend({ transactionId: idSchema })
const successSchema = z.strictObject({ success: z.literal(true) })

export const budgetsContract = {
  list: protectedContract
    .route({
      method: 'GET',
      path: '/api/v1/budgets',
      operationId: 'listBudgets',
      tags: ['Budgets'],
      summary: 'List the User Budgets',
    })
    .output(
      z.array(
        z.union([
          monthlyBudgetSchema.extend({ createdAt: timestampSchema }),
          scenarioBudgetSchema.extend({ createdAt: timestampSchema }),
        ]),
      ),
    ),
  create: protectedContract
    .errors({ CONFLICT: { status: 409 } })
    .route({
      method: 'POST',
      path: '/api/v1/budgets',
      operationId: 'createBudget',
      tags: ['Budgets'],
      summary: 'Create a Monthly or Scenario Budget',
      successStatus: 201,
    })
    .input(budgetTargetSchema)
    .output(budgetReferenceSchema),
  get: protectedContract
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: 'GET',
      path: '/api/v1/budgets/{budgetId}',
      operationId: 'getBudget',
      tags: ['Budgets'],
      summary: 'Get a Budget with Categories and Transactions',
    })
    .input(budgetIdInput)
    .output(budgetPageSchema),
  delete: protectedContract
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: 'DELETE',
      path: '/api/v1/budgets/{budgetId}',
      operationId: 'deleteBudget',
      tags: ['Budgets'],
      summary: 'Delete a Budget',
    })
    .input(budgetIdInput)
    .output(successSchema),
  duplicate: protectedContract
    .errors({ NOT_FOUND: { status: 404 }, CONFLICT: { status: 409 } })
    .route({
      method: 'POST',
      path: '/api/v1/budgets/{budgetId}/duplicate',
      operationId: 'duplicateBudget',
      tags: ['Budgets'],
      summary: 'Duplicate a Budget',
      successStatus: 201,
    })
    .input(z.intersection(budgetIdInput, duplicateBudgetTargetSchema))
    .output(budgetReferenceSchema),
  addCategory: protectedContract
    .errors({ NOT_FOUND: { status: 404 }, CONFLICT: { status: 409 } })
    .route({
      method: 'POST',
      path: '/api/v1/budgets/{budgetId}/categories',
      operationId: 'addBudgetCategory',
      tags: ['Budgets'],
      summary: 'Add a reusable Category to a Budget',
      successStatus: 201,
    })
    .input(budgetIdInput.extend({ categoryId: idSchema }))
    .output(successSchema),
  positionCategory: protectedContract
    .errors({ NOT_FOUND: { status: 404 }, INVALID_POSITION: { status: 400 } })
    .route({
      method: 'PATCH',
      path: '/api/v1/budgets/{budgetId}/categories/{budgetCategoryId}/position',
      operationId: 'positionBudgetCategory',
      tags: ['Budgets'],
      summary: 'Position a BudgetCategory',
    })
    .input(
      budgetCategoryIdInput.extend({
        targetIndex: z.number().int().nonnegative(),
      }),
    )
    .output(successSchema),
  replaceAllocationTargets: protectedContract
    .errors({
      NOT_FOUND: { status: 404 },
      INVALID_ALLOCATION_TARGETS: { status: 400 },
    })
    .route({
      method: 'PUT',
      path: '/api/v1/budgets/{budgetId}/allocation-targets',
      operationId: 'replaceBudgetAllocationTargets',
      tags: ['Budgets'],
      summary: 'Replace Budget Allocation Targets',
    })
    .input(z.intersection(budgetIdInput, budgetAllocationTargetsSchema))
    .output(budgetAllocationTargetsSchema),
  createTransaction: protectedContract
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: 'POST',
      path: '/api/v1/budgets/{budgetId}/transactions',
      operationId: 'createTransaction',
      tags: ['Transactions'],
      summary: 'Create a Transaction',
      successStatus: 201,
    })
    .input(
      budgetIdInput.extend({
        budgetCategoryId: idSchema,
        ...transactionFieldsSchema.shape,
      }),
    )
    .output(z.strictObject({ id: idSchema })),
  updateTransaction: protectedContract
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: 'PATCH',
      path: '/api/v1/budgets/{budgetId}/transactions/{transactionId}',
      operationId: 'updateTransaction',
      tags: ['Transactions'],
      summary: 'Update a Transaction',
    })
    .input(transactionIdInput.extend(transactionFieldsSchema.shape))
    .output(successSchema),
  deleteTransaction: protectedContract
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: 'DELETE',
      path: '/api/v1/budgets/{budgetId}/transactions/{transactionId}',
      operationId: 'deleteTransaction',
      tags: ['Transactions'],
      summary: 'Delete a Transaction',
    })
    .input(transactionIdInput)
    .output(successSchema),
  setTransactionPaid: protectedContract
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: 'PUT',
      path: '/api/v1/budgets/{budgetId}/transactions/{transactionId}/paid',
      operationId: 'setTransactionPaid',
      tags: ['Transactions'],
      summary: 'Set Transaction paid state',
    })
    .input(transactionIdInput.extend({ isPaid: z.boolean() }))
    .output(successSchema),
  positionTransaction: protectedContract
    .errors({ NOT_FOUND: { status: 404 }, INVALID_POSITION: { status: 400 } })
    .route({
      method: 'PATCH',
      path: '/api/v1/budgets/{budgetId}/transactions/{transactionId}/position',
      operationId: 'positionTransaction',
      tags: ['Transactions'],
      summary: 'Move or reorder a Transaction',
    })
    .input(
      transactionIdInput.extend({
        targetBudgetCategoryId: idSchema,
        targetIndex: z.number().int().nonnegative(),
      }),
    )
    .output(successSchema),
}
