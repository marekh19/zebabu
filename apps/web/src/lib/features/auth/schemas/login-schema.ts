import * as m from '$lib/paraglide/messages'
import { z } from 'zod/v4'

export function createLoginSchema() {
  return z.object({
    email: z.email({ message: m.auth_validation_email() }),
    password: z
      .string()
      .min(1, { message: m.login_validation_password_required() }),
  })
}
