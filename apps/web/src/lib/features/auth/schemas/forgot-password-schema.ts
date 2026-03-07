import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

export function createForgotPasswordSchema() {
  return z.object({
    email: z.email({ message: m.auth_validation_email() }),
  })
}
