export const CategoryType = {
  Income: 'income',
  Expense: 'expense',
} as const

export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType]
