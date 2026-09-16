export const OperationErrorCode = {
  Unauthorized: 'UNAUTHORIZED',
  NotFound: 'NOT_FOUND',
  Conflict: 'CONFLICT',
  InvalidInput: 'INVALID_INPUT',
  InvalidPosition: 'INVALID_POSITION',
} as const

export type OperationErrorCode =
  (typeof OperationErrorCode)[keyof typeof OperationErrorCode]

export type OperationFailure<Code extends OperationErrorCode> = Readonly<{
  error: Code
}>

export type OperationSuccess<Value = undefined> = Readonly<{
  value: Value
  error?: never
}>

export type OperationResult<
  Value,
  Code extends OperationErrorCode = OperationErrorCode,
> = OperationSuccess<Value> | OperationFailure<Code>
