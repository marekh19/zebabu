import { OperationErrorCode } from '$lib/operation-result'
import { error } from '@sveltejs/kit'

export function getAuthenticatedUserId(locals: App.Locals) {
  if (!locals.user) {
    error(401, {
      code: OperationErrorCode.Unauthorized,
      message: 'Authentication required',
    })
  }

  return locals.user.id
}
