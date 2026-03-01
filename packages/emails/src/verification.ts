import React from 'react'
import { sendEmail } from './send'
import VerificationEmail from './templates/verification-email'

interface SendVerificationEmailOptions {
  to: string
  url: string
  from: string
  apiKey: string
}

export async function sendVerificationEmail({
  to,
  url,
  from,
  apiKey,
}: SendVerificationEmailOptions) {
  return sendEmail({
    to,
    subject: 'Verify your email',
    template: React.createElement(VerificationEmail, { url }),
    from,
    apiKey,
  })
}
