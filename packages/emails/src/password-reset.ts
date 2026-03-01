import React from 'react'
import { sendEmail } from './send'
import PasswordResetEmail from './templates/password-reset-email'

type SendPasswordResetEmailOptions = {
  to: string
  url: string
  from: string
  apiKey: string
}

export async function sendPasswordResetEmail({
  to,
  url,
  from,
  apiKey,
}: SendPasswordResetEmailOptions) {
  return sendEmail({
    to,
    subject: 'Reset your password',
    template: React.createElement(PasswordResetEmail, { url }),
    from,
    apiKey,
  })
}
