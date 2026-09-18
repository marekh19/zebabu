import { ORPCError, implement } from '@orpc/server'
import { categoriesContract } from '@zebabu/api-contract'
import {
  CategoryInUseError,
  CategoryNotFoundError,
  DuplicateCategoryError,
  InvalidAllocationTargetsError,
  LastCategoryOfTypeError,
  NonZeroAllocationTargetError,
  createCategory,
  deleteCategory,
  getCompleteDefaultAllocationTargets,
  listCategories,
  saveDefaultAllocationTargets,
  updateCategory,
} from '../lib/budget-planning/server/categories/service'
import { requireUser, type RequestContext } from '../principal'

const procedures = implement(categoriesContract).$context<RequestContext>()

function mapCategoryError(error: unknown): never {
  if (error instanceof CategoryNotFoundError) throw new ORPCError('NOT_FOUND')
  if (error instanceof DuplicateCategoryError) throw new ORPCError('CONFLICT')
  if (error instanceof CategoryInUseError)
    throw new ORPCError('CATEGORY_IN_USE', { status: 409 })
  if (error instanceof LastCategoryOfTypeError)
    throw new ORPCError('LAST_CATEGORY_OF_TYPE', { status: 409 })
  if (error instanceof NonZeroAllocationTargetError)
    throw new ORPCError('NON_ZERO_ALLOCATION_TARGET', { status: 409 })
  if (error instanceof InvalidAllocationTargetsError)
    throw new ORPCError('INVALID_ALLOCATION_TARGETS', { status: 400 })
  throw error
}

export const categoriesRouter = procedures.router({
  list: procedures.list.handler(async ({ context }) => {
    const user = await requireUser(context)
    return listCategories(user.id)
  }),
  create: procedures.create.handler(async ({ context, input }) => {
    const user = await requireUser(context)
    try {
      await createCategory(user.id, input)
      const created = (await listCategories(user.id)).find(
        (category) => category.name === input.name,
      )
      if (!created) throw new Error('Created Category not found')
      return created
    } catch (error) {
      return mapCategoryError(error)
    }
  }),
  update: procedures.update.handler(async ({ context, input }) => {
    const user = await requireUser(context)
    try {
      await updateCategory(input.categoryId, user.id, input)
      const updated = (await listCategories(user.id)).find(
        (category) => category.id === input.categoryId,
      )
      if (!updated) throw new Error('Updated Category not found')
      return updated
    } catch (error) {
      return mapCategoryError(error)
    }
  }),
  delete: procedures.delete.handler(async ({ context, input }) => {
    const user = await requireUser(context)
    try {
      await deleteCategory(input.categoryId, user.id)
      return { success: true }
    } catch (error) {
      return mapCategoryError(error)
    }
  }),
  replaceAllocationTargets: procedures.replaceAllocationTargets.handler(
    async ({ context, input }) => {
      const user = await requireUser(context)
      try {
        await saveDefaultAllocationTargets(user.id, {
          enabled: input.enabled,
          targets: input.targets.map(({ categoryId, value }) => ({
            categoryId,
            value: Number(value),
          })),
        })
        const targets = await getCompleteDefaultAllocationTargets(user.id)
        return targets
          ? { enabled: true, targets }
          : { enabled: false, targets: [] }
      } catch (error) {
        return mapCategoryError(error)
      }
    },
  ),
})
