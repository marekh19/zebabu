import * as m from '$lib/paraglide/messages'
import { isKeyOf } from 'narrowland'

const errorCodeToMessage = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: m.auth_error_user_already_exists,
  FAILED_TO_CREATE_USER: m.auth_error_failed_to_create_user,
  FAILED_TO_CREATE_SESSION: m.auth_error_failed_to_create_session,
  INVALID_EMAIL_OR_PASSWORD: m.auth_error_invalid_credentials,
  EMAIL_NOT_VERIFIED: m.auth_error_email_not_verified,
  TOO_MANY_REQUESTS: m.auth_error_too_many_requests,
  INVALID_TOKEN: m.reset_password_invalid_token,
} as const

export function getAuthError(code: string): string {
  if (isKeyOf(code, errorCodeToMessage)) {
    return errorCodeToMessage[code]()
  }
  return m.auth_error_unknown()
}
