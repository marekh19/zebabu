import {
  PASSWORD_HAS_LETTER,
  PASSWORD_HAS_NUMBER,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '$lib/features/auth/constants/password-rules'
import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

export function createResetPasswordSchema() {
  return z
    .object({
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, { message: m.auth_validation_password_min() })
        .max(PASSWORD_MAX_LENGTH, { message: m.auth_validation_password_max() })
        .refine(
          (v) => PASSWORD_HAS_LETTER.test(v) && PASSWORD_HAS_NUMBER.test(v),
          { message: m.auth_validation_password_complexity() },
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: m.auth_validation_passwords_mismatch(),
    })
}
