import * as m from '$lib/paraglide/messages'
import { z } from 'zod'
import { createEmailSchema } from './fields'

export function createLoginSchema() {
  return z.object({
    email: createEmailSchema(),
    password: z
      .string()
      .min(1, { message: m.login_validation_password_required() }),
  })
}
