export const OperationErrorCode = {
  Unauthorized: 'UNAUTHORIZED',
  NotFound: 'NOT_FOUND',
  Conflict: 'CONFLICT',
  InvalidInput: 'INVALID_INPUT',
  InvalidPosition: 'INVALID_POSITION',
} as const

export type OperationErrorCode =
  (typeof OperationErrorCode)[keyof typeof OperationErrorCode]
