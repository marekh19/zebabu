import { implement, ORPCError } from '@orpc/server'
import {
  budgetPageSchema,
  budgetReferenceSchema,
  budgetsContract,
} from '@zebabu/api-contract'
import {
  addBudgetCategory,
  createMonthlyBudget,
  createScenarioBudget,
  createTransaction,
  deleteBudget,
  deleteTransaction,
  duplicateBudget,
  DuplicateMonthlyBudgetError,
  DuplicateScenarioBudgetError,
  getBudgetDetail,
  InvalidBudgetAllocationTargetsError,
  listBudgets,
  positionTransaction,
  reorderBudgetCategories,
  saveBudgetAllocationTargets,
  updateTransaction,
  updateTransactionPaid,
} from '../lib/budget-planning/server/budgets/service'
import { requireUser, type RequestContext } from '../principal'

const procedures = implement(budgetsContract).$context<RequestContext>()

function mapBudgetError(error: unknown): never {
  if (
    error instanceof DuplicateMonthlyBudgetError ||
    error instanceof DuplicateScenarioBudgetError
  ) {
    throw new ORPCError('CONFLICT')
  }
  if (error instanceof InvalidBudgetAllocationTargetsError) {
    throw new ORPCError('INVALID_ALLOCATION_TARGETS', { status: 400 })
  }
  throw error
}

function requireSuccess(result: { error?: 'NOT_FOUND' | 'INVALID_POSITION' }) {
  if (result.error === 'NOT_FOUND') throw new ORPCError('NOT_FOUND')
  if (result.error === 'INVALID_POSITION')
    throw new ORPCError('INVALID_POSITION', { status: 400 })
}

async function requireBudgetPage(budgetId: string, userId: string) {
  const result = await getBudgetDetail(budgetId, userId)
  if (result.error) throw new ORPCError('NOT_FOUND')
  return budgetPageSchema.parse({
    budget: result.budget,
    availableCategories: result.availableCategories,
  })
}

export const budgetsRouter = procedures.router({
  list: procedures.list.handler(async ({ context }) =>
    listBudgets((await requireUser(context)).id),
  ),
  create: procedures.create.handler(async ({ context, input }) => {
    const userId = (await requireUser(context)).id
    try {
      const created =
        input.type === 'monthly'
          ? await createMonthlyBudget(userId, input)
          : await createScenarioBudget(userId, input)
      return budgetReferenceSchema.parse(
        input.type === 'monthly'
          ? {
              id: created.id,
              type: 'monthly',
              name: null,
              month: input.month,
              year: input.year,
            }
          : {
              id: created.id,
              type: 'scenario',
              name: input.name,
              month: null,
              year: null,
            },
      )
    } catch (error) {
      return mapBudgetError(error)
    }
  }),
  get: procedures.get.handler(async ({ context, input }) =>
    requireBudgetPage(input.budgetId, (await requireUser(context)).id),
  ),
  delete: procedures.delete.handler(async ({ context, input }) => {
    requireSuccess(
      await deleteBudget(input.budgetId, (await requireUser(context)).id),
    )
    return { success: true }
  }),
  duplicate: procedures.duplicate.handler(async ({ context, input }) => {
    const userId = (await requireUser(context)).id
    try {
      const result = await duplicateBudget(input.budgetId, userId, input)
      if (result.error) throw new ORPCError('NOT_FOUND')
      return budgetReferenceSchema.parse(
        input.type === 'monthly'
          ? {
              id: result.budget.id,
              type: 'monthly',
              name: null,
              month: input.month,
              year: input.year,
            }
          : {
              id: result.budget.id,
              type: 'scenario',
              name: input.name,
              month: null,
              year: null,
            },
      )
    } catch (error) {
      return mapBudgetError(error)
    }
  }),
  addCategory: procedures.addCategory.handler(async ({ context, input }) => {
    requireSuccess(
      await addBudgetCategory(
        input.budgetId,
        (await requireUser(context)).id,
        input.categoryId,
      ),
    )
    return { success: true }
  }),
  positionCategory: procedures.positionCategory.handler(
    async ({ context, input }) => {
      const userId = (await requireUser(context)).id
      const page = await requireBudgetPage(input.budgetId, userId)
      const existing = page.budget.budgetCategories
      const moving = existing.find(({ id }) => id === input.budgetCategoryId)
      if (!moving) throw new ORPCError('NOT_FOUND')
      if (input.targetIndex >= existing.length)
        throw new ORPCError('INVALID_POSITION', { status: 400 })
      const remaining = existing.filter(({ id }) => id !== moving.id)
      const ordered = [
        ...remaining.slice(0, input.targetIndex),
        moving,
        ...remaining.slice(input.targetIndex),
      ]
      requireSuccess(
        await reorderBudgetCategories(
          input.budgetId,
          userId,
          ordered.map(({ id }, sortOrder) => ({ id, sortOrder })),
        ),
      )
      return { success: true }
    },
  ),
  replaceAllocationTargets: procedures.replaceAllocationTargets.handler(
    async ({ context, input }) => {
      const userId = (await requireUser(context)).id
      try {
        requireSuccess(
          await saveBudgetAllocationTargets(input.budgetId, userId, {
            enabled: input.enabled,
            targets: input.targets.map(({ budgetCategoryId, value }) => ({
              categoryId: budgetCategoryId,
              value: Number(value),
            })),
          }),
        )
        const page = await requireBudgetPage(input.budgetId, userId)
        const targets = page.budget.budgetCategories
          .filter(({ allocationTarget }) => allocationTarget !== null)
          .map(({ id, allocationTarget }) => ({
            budgetCategoryId: id,
            value: allocationTarget ?? '0.0',
          }))
        return { enabled: targets.length > 0, targets }
      } catch (error) {
        return mapBudgetError(error)
      }
    },
  ),
  createTransaction: procedures.createTransaction.handler(
    async ({ context, input }) => {
      const result = await createTransaction(
        input.budgetId,
        (await requireUser(context)).id,
        input.budgetCategoryId,
        {
          name: input.name,
          amount: Number(input.amount),
          isPaid: input.isPaid,
          note: input.note,
        },
      )
      requireSuccess(result)
      if (!result.id) throw new Error('Transaction was not created')
      return { id: result.id }
    },
  ),
  updateTransaction: procedures.updateTransaction.handler(
    async ({ context, input }) => {
      requireSuccess(
        await updateTransaction(
          input.budgetId,
          (await requireUser(context)).id,
          input.transactionId,
          {
            name: input.name,
            amount: Number(input.amount),
            isPaid: input.isPaid,
            note: input.note,
          },
        ),
      )
      return { success: true }
    },
  ),
  deleteTransaction: procedures.deleteTransaction.handler(
    async ({ context, input }) => {
      requireSuccess(
        await deleteTransaction(
          input.budgetId,
          (await requireUser(context)).id,
          input.transactionId,
        ),
      )
      return { success: true }
    },
  ),
  setTransactionPaid: procedures.setTransactionPaid.handler(
    async ({ context, input }) => {
      requireSuccess(
        await updateTransactionPaid(
          input.budgetId,
          (await requireUser(context)).id,
          input.transactionId,
          input.isPaid,
        ),
      )
      return { success: true }
    },
  ),
  positionTransaction: procedures.positionTransaction.handler(
    async ({ context, input }) => {
      requireSuccess(
        await positionTransaction({
          ...input,
          userId: (await requireUser(context)).id,
        }),
      )
      return { success: true }
    },
  ),
})
