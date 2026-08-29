import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

export function createEmailSchema() {
  return z.email({ message: m.auth_validation_email() })
}
