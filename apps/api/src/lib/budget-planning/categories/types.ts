export const CategoryType = {
  Income: 'income',
  Expense: 'expense',
} as const

export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType]

export const categoryColors = [
  'slate',
  'rose',
  'emerald',
  'amber',
  'sky',
  'violet',
  'orange',
  'teal',
] as const

export type CategoryColor = (typeof categoryColors)[number]
