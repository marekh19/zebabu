import * as m from '$lib/paraglide/messages'
import { z } from 'zod/v4'

export function createSignupSchema() {
  return z
    .object({
      name: z
        .string()
        .min(2, { message: m.auth_validation_name_min() })
        .max(50, { message: m.auth_validation_name_max() }),
      email: z.email({ message: m.auth_validation_email() }),
      password: z
        .string()
        .min(8, { message: m.auth_validation_password_min() })
        .max(128, { message: m.auth_validation_password_max() })
        .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), {
          message: m.auth_validation_password_complexity(),
        }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: m.auth_validation_passwords_mismatch(),
    })
}
