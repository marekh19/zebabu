export const BudgetType = {
  Monthly: 'monthly',
  Scenario: 'scenario',
} as const

export type BudgetType = (typeof BudgetType)[keyof typeof BudgetType]
