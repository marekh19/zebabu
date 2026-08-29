import { ensureDefined } from 'narrowland'

export function getAuthenticatedUserId(locals: App.Locals) {
  return ensureDefined(locals.user).id
}
