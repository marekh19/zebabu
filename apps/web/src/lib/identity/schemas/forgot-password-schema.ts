import { z } from 'zod'
import { createEmailSchema } from './fields'

export function createForgotPasswordSchema() {
  return z.object({
    email: createEmailSchema(),
  })
}
