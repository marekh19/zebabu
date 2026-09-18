import { z } from 'zod'
import { protectedContract } from './base'
import { idSchema, percentageSchema } from './schemas'

export const categoryColorSchema = z.enum([
  'slate',
  'rose',
  'emerald',
  'amber',
  'sky',
  'violet',
  'orange',
  'teal',
])
export const categoryTypeSchema = z.enum(['income', 'expense'])

export const categorySchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(100),
  type: categoryTypeSchema,
  color: categoryColorSchema,
  defaultAllocationTarget: percentageSchema.nullable(),
  budgetUsageCount: z.number().int().nonnegative(),
})

export const allocationTargetsSchema = z.strictObject({
  enabled: z.boolean(),
  targets: z.array(
    z.strictObject({ categoryId: idSchema, value: percentageSchema }),
  ),
})

const categoryIdInput = z.strictObject({ categoryId: idSchema })

export const categoriesContract = {
  list: protectedContract
    .route({
      method: 'GET',
      path: '/api/v1/categories',
      operationId: 'listCategories',
      tags: ['Categories'],
      summary: 'List reusable Categories and Budget usage',
    })
    .output(z.array(categorySchema)),
  create: protectedContract
    .errors({ CONFLICT: { status: 409 } })
    .route({
      method: 'POST',
      path: '/api/v1/categories',
      operationId: 'createCategory',
      tags: ['Categories'],
      summary: 'Create a Category',
      successStatus: 201,
    })
    .input(categorySchema.pick({ name: true, type: true, color: true }))
    .output(categorySchema),
  update: protectedContract
    .errors({ NOT_FOUND: { status: 404 }, CONFLICT: { status: 409 } })
    .route({
      method: 'PATCH',
      path: '/api/v1/categories/{categoryId}',
      operationId: 'updateCategory',
      tags: ['Categories'],
      summary: 'Update a Category',
    })
    .input(
      categoryIdInput.extend({
        name: categorySchema.shape.name,
        color: categoryColorSchema,
      }),
    )
    .output(categorySchema),
  delete: protectedContract
    .errors({
      NOT_FOUND: { status: 404 },
      CATEGORY_IN_USE: { status: 409 },
      LAST_CATEGORY_OF_TYPE: { status: 409 },
      NON_ZERO_ALLOCATION_TARGET: { status: 409 },
    })
    .route({
      method: 'DELETE',
      path: '/api/v1/categories/{categoryId}',
      operationId: 'deleteCategory',
      tags: ['Categories'],
      summary: 'Delete a Category',
    })
    .input(categoryIdInput)
    .output(z.strictObject({ success: z.literal(true) })),
  replaceAllocationTargets: protectedContract
    .errors({ INVALID_ALLOCATION_TARGETS: { status: 400 } })
    .route({
      method: 'PUT',
      path: '/api/v1/categories/allocation-targets',
      operationId: 'replaceDefaultAllocationTargets',
      tags: ['Categories'],
      summary: 'Replace default Allocation Targets',
    })
    .input(allocationTargetsSchema)
    .output(allocationTargetsSchema),
}
