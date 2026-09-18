import { oc } from '@orpc/contract'

export const protectedContract = oc.errors({
  UNAUTHORIZED: { status: 401 },
  FORBIDDEN: { status: 403 },
  INVALID_INPUT: { status: 400 },
  PAYLOAD_TOO_LARGE: { status: 413 },
  RATE_LIMITED: { status: 429 },
  INTERNAL_ERROR: { status: 500 },
})
