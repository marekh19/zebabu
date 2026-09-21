import { database as db } from '#api-database'
import { ensureDefined } from 'narrowland'
import { findOwnedBudgetCategory } from '../budget-categories/repository'
import { lockBudget } from '../repository'
import { OperationErrorCode } from '../result'
import {
  deleteTransactionById,
  findOwnedTransaction,
  insertTransactionAtEnd,
  listTransactionIds,
  updateTransactionById,
  updateTransactionPaidById,
  updateTransactionPositions,
} from './repository'
import { positionTransactionIds } from './rules'

type EditableTransactionData = {
  name: string
  amount: number
  isPaid: boolean
  note?: string
}

export async function createTransaction(
  budgetId: string,
  userId: string,
  budgetCategoryId: string,
  data: EditableTransactionData,
) {
  return db.transaction(async (tx) => {
    const destination = await findOwnedBudgetCategory(
      tx,
      budgetCategoryId,
      budgetId,
      userId,
    )
    if (!destination) return { error: OperationErrorCode.NotFound }

    const [inserted] = await insertTransactionAtEnd(
      tx,
      {
        budgetCategoryId,
        name: data.name,
        amount: String(data.amount),
        isPaid: data.isPaid,
        note: data.note || null,
      },
      budgetId,
      userId,
    )

    return { id: ensureDefined(inserted).id }
  })
}

export async function updateTransaction(
  budgetId: string,
  userId: string,
  transactionId: string,
  data: EditableTransactionData,
) {
  return db.transaction(async (tx) => {
    const found = await findOwnedTransaction(
      tx,
      transactionId,
      budgetId,
      userId,
    )
    if (!found) return { error: OperationErrorCode.NotFound }

    await updateTransactionById(tx, transactionId, budgetId, userId, {
      name: data.name,
      amount: String(data.amount),
      isPaid: data.isPaid,
      note: data.note || null,
    })

    return {}
  })
}

export async function updateTransactionPaid(
  budgetId: string,
  userId: string,
  transactionId: string,
  isPaid: boolean,
) {
  return db.transaction(async (tx) => {
    const found = await findOwnedTransaction(
      tx,
      transactionId,
      budgetId,
      userId,
    )
    if (!found) return { error: OperationErrorCode.NotFound }

    await updateTransactionPaidById(tx, transactionId, budgetId, userId, isPaid)

    return {}
  })
}

type PositionTransactionCommand = Readonly<{
  budgetId: string
  userId: string
  transactionId: string
  targetBudgetCategoryId: string
  targetIndex: number
}>

export async function positionTransaction({
  budgetId,
  userId,
  transactionId,
  targetBudgetCategoryId,
  targetIndex,
}: PositionTransactionCommand) {
  return db.transaction(async (tx) => {
    await lockBudget(tx, budgetId, userId)

    const sourceTransaction = await findOwnedTransaction(
      tx,
      transactionId,
      budgetId,
      userId,
    )
    if (!sourceTransaction) return { error: OperationErrorCode.NotFound }

    const targetBudgetCategory = await findOwnedBudgetCategory(
      tx,
      targetBudgetCategoryId,
      budgetId,
      userId,
    )
    if (!targetBudgetCategory) return { error: OperationErrorCode.NotFound }

    const sourceRows = await listTransactionIds(
      tx,
      sourceTransaction.budgetCategoryId,
      budgetId,
      userId,
    )
    const sameCategory =
      sourceTransaction.budgetCategoryId === targetBudgetCategoryId
    const targetRows = sameCategory
      ? sourceRows
      : await listTransactionIds(tx, targetBudgetCategoryId, budgetId, userId)
    const positions = positionTransactionIds(
      sourceRows.map(({ id }) => id),
      targetRows.map(({ id }) => id),
      transactionId,
      targetIndex,
      sameCategory,
    )
    if (!positions) return { error: OperationErrorCode.InvalidPosition }

    await updateTransactionPositions(
      tx,
      transactionId,
      targetBudgetCategoryId,
      budgetId,
      userId,
      positions.sourceIds,
      positions.targetIds,
    )

    return {}
  })
}

export async function deleteTransaction(
  budgetId: string,
  userId: string,
  transactionId: string,
) {
  return db.transaction(async (tx) => {
    const found = await findOwnedTransaction(
      tx,
      transactionId,
      budgetId,
      userId,
    )
    if (!found) return { error: OperationErrorCode.NotFound }

    await deleteTransactionById(tx, transactionId, budgetId, userId)
    return {}
  })
}
